/**
 * GTFS-RT style vehicle simulator.
 *
 * Loads route geometry (ordered stops) from the DB, then moves each vehicle
 * continuously along its route — interpolating position between consecutive
 * stops, computing bearing, and bouncing back at the terminus. Subscribers
 * receive a fresh snapshot every TICK_MS milliseconds via an event emitter,
 * mimicking a GTFS-RT VehiclePosition feed.
 */

import { EventEmitter } from "node:events";
import { db, routesTable, stopsTable, routeStopsTable, vehiclesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

export const TICK_MS = 3000; // broadcast interval

interface StopPoint {
  lat: number;
  lng: number;
  name: string;
}

interface RouteGeometry {
  routeId: number;
  color: string;
  stops: StopPoint[];
}

export interface LiveVehicle {
  id: string;
  routeId: number;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  occupancy: "low" | "medium" | "high";
  lastUpdated: string;
  routeColor: string;
  nextStop: string;
}

interface VehicleState {
  id: string;
  routeId: number;
  occupancy: "low" | "medium" | "high";
  /** Index of the stop we are *departing from* in the route stops array */
  segmentIdx: number;
  /** 0.0 → at segmentIdx stop, 1.0 → at segmentIdx+1 stop */
  fraction: number;
  /** true = travelling from stop[0] to stop[n-1], false = reverse */
  forward: boolean;
  /** degrees per tick (controls visual speed) */
  fractionPerTick: number;
}

// ---------- haversine / bearing helpers ----------

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function bearing(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ---------- simulator class ----------

class VehicleSimulator extends EventEmitter {
  private geometries = new Map<number, RouteGeometry>();
  private states = new Map<string, VehicleState>();
  private timer: NodeJS.Timeout | null = null;
  private snapshot: LiveVehicle[] = [];

  /** Load route geometry + initial vehicle states from the DB */
  async init() {
    try {
      await this.loadGeometries();
      await this.loadVehicles();
      this.start();
      logger.info({ vehicleCount: this.states.size }, "Vehicle simulator started");
    } catch (err) {
      logger.error({ err }, "Vehicle simulator failed to init");
    }
  }

  private async loadGeometries() {
    const routes = await db.select().from(routesTable);
    for (const route of routes) {
      const routeStopRows = await db
        .select({ stop: stopsTable, sequence: routeStopsTable.sequence })
        .from(routeStopsTable)
        .innerJoin(stopsTable, eq(routeStopsTable.stopId, stopsTable.id))
        .where(eq(routeStopsTable.routeId, route.id))
        .orderBy(asc(routeStopsTable.sequence));

      if (routeStopRows.length < 2) continue;

      const stops: StopPoint[] = routeStopRows.map(({ stop }) => ({
        lat: parseFloat(stop.lat),
        lng: parseFloat(stop.lng),
        name: stop.name,
      }));

      this.geometries.set(route.id, { routeId: route.id, color: route.color, stops });
    }
    logger.info({ routeCount: this.geometries.size }, "Route geometries loaded");
  }

  private async loadVehicles() {
    const vehicles = await db.select().from(vehiclesTable);

    // Spread vehicles along their route so they don't all bunch at stop 0
    const routeOffset = new Map<number, number>();

    for (const v of vehicles) {
      const geo = this.geometries.get(v.routeId);
      if (!geo || geo.stops.length < 2) continue;

      const offset = routeOffset.get(v.routeId) ?? 0;
      routeOffset.set(v.routeId, offset + 1);

      const totalSegments = geo.stops.length - 1;
      const segmentIdx = Math.floor((offset / 3) * totalSegments) % totalSegments;

      // Faster fraction-per-tick for metro/rail, slower for bus
      // Distance between two consecutive stops used to normalise speed
      const s0 = geo.stops[segmentIdx];
      const s1 = geo.stops[segmentIdx + 1];
      const segDistKm = haversineKm(s0.lat, s0.lng, s1.lat, s1.lng);
      // Target 25–70 km/h; tick every 3 s → distance per tick = speed * (3/3600) km
      const speedKmh = v.routeId <= 3 ? 30 + Math.random() * 15 : 55 + Math.random() * 15;
      const kmPerTick = speedKmh * (TICK_MS / 3_600_000);
      const fractionPerTick = segDistKm > 0 ? kmPerTick / segDistKm : 0.05;

      this.states.set(v.id, {
        id: v.id,
        routeId: v.routeId,
        occupancy: v.occupancy,
        segmentIdx,
        fraction: (offset * 0.33) % 1,
        forward: offset % 2 === 0,
        fractionPerTick: Math.min(fractionPerTick, 0.3),
      });
    }
  }

  private tick() {
    const now = new Date().toISOString();
    const updated: LiveVehicle[] = [];

    for (const state of this.states.values()) {
      const geo = this.geometries.get(state.routeId);
      if (!geo) continue;

      const stops = geo.stops;
      const maxSeg = stops.length - 2;

      // Advance fraction
      state.fraction += state.fractionPerTick;

      // Move to next segment when fraction crosses 1
      while (state.fraction >= 1) {
        state.fraction -= 1;
        if (state.forward) {
          state.segmentIdx++;
          if (state.segmentIdx > maxSeg) {
            state.segmentIdx = maxSeg;
            state.forward = false;
          }
        } else {
          state.segmentIdx--;
          if (state.segmentIdx < 0) {
            state.segmentIdx = 0;
            state.forward = true;
          }
        }
      }

      const fromStop = stops[state.segmentIdx];
      const toStop = stops[state.forward ? state.segmentIdx + 1 : state.segmentIdx];
      const nextStop = stops[state.forward ? state.segmentIdx + 1 : state.segmentIdx];

      const lat = lerp(fromStop.lat, toStop.lat, state.fraction);
      const lng = lerp(fromStop.lng, toStop.lng, state.fraction);
      const dir = bearing(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);

      const segDistKm = haversineKm(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);
      const speedKmh = Math.round((state.fractionPerTick * segDistKm) / (TICK_MS / 3_600_000));

      // Randomly shift occupancy occasionally
      if (Math.random() < 0.02) {
        const opts: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
        state.occupancy = opts[Math.floor(Math.random() * opts.length)];
      }

      updated.push({
        id: state.id,
        routeId: state.routeId,
        lat: Math.round(lat * 1e6) / 1e6,
        lng: Math.round(lng * 1e6) / 1e6,
        speed: speedKmh,
        direction: Math.round(dir),
        occupancy: state.occupancy,
        lastUpdated: now,
        routeColor: geo.color,
        nextStop: nextStop.name,
      });
    }

    this.snapshot = updated;
    this.emit("update", updated);
  }

  private start() {
    this.tick(); // immediate first tick
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  getSnapshot(): LiveVehicle[] {
    return this.snapshot;
  }
}

export const vehicleSimulator = new VehicleSimulator();
