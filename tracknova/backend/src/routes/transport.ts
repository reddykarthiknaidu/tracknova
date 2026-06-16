import { Router } from "express";
import { db, routesTable, stopsTable, routeStopsTable, vehiclesTable, favoritesTable } from "@workspace/db";
import { eq, like, and, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

// GET /api/routes
router.get("/routes", async (req, res) => {
  try {
    const { type, search } = req.query as { type?: string; search?: string };

    const conditions = [];
    if (type && ["bus", "metro", "suburban-rail"].includes(type)) {
      conditions.push(eq(routesTable.type, type as "bus" | "metro" | "suburban-rail"));
    }
    if (search) {
      conditions.push(like(routesTable.name, `%${search}%`));
    }

    const routes = conditions.length > 0
      ? await db.select().from(routesTable).where(and(...conditions))
      : await db.select().from(routesTable);

    res.json(routes);
  } catch (err) {
    req.log.error({ err }, "Failed to list routes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/routes/:id
router.get("/routes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [route] = await db.select().from(routesTable).where(eq(routesTable.id, id));
    if (!route) {
      res.status(404).json({ error: "Route not found" });
      return;
    }

    const routeStops = await db
      .select({ stop: stopsTable, sequence: routeStopsTable.sequence })
      .from(routeStopsTable)
      .innerJoin(stopsTable, eq(routeStopsTable.stopId, stopsTable.id))
      .where(eq(routeStopsTable.routeId, id))
      .orderBy(routeStopsTable.sequence);

    const stops = routeStops.map(({ stop }) => ({
      ...stop,
      lat: parseFloat(stop.lat),
      lng: parseFloat(stop.lng),
      routeIds: [id],
    }));

    res.json({ ...route, stops });
  } catch (err) {
    req.log.error({ err }, "Failed to get route");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stops
router.get("/stops", async (req, res) => {
  try {
    const stops = await db.select().from(stopsTable);
    const stopIds = stops.map((s) => s.id);

    const routeStopRows = stopIds.length > 0
      ? await db.select().from(routeStopsTable).where(inArray(routeStopsTable.stopId, stopIds))
      : [];

    const routeIdsByStop: Record<number, number[]> = {};
    for (const rs of routeStopRows) {
      if (!routeIdsByStop[rs.stopId]) routeIdsByStop[rs.stopId] = [];
      routeIdsByStop[rs.stopId].push(rs.routeId);
    }

    res.json(
      stops.map((s) => ({
        ...s,
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        routeIds: routeIdsByStop[s.id] ?? [],
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list stops");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stops/:id
router.get("/stops/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [stop] = await db.select().from(stopsTable).where(eq(stopsTable.id, id));
    if (!stop) {
      res.status(404).json({ error: "Stop not found" });
      return;
    }

    const routeStopRows = await db
      .select({ routeId: routeStopsTable.routeId, sequence: routeStopsTable.sequence })
      .from(routeStopsTable)
      .where(eq(routeStopsTable.stopId, id));

    const arrivals = routeStopRows.map((rs, i) => {
      // Deterministic arrival cycle of 15 minutes per route stop
      const cycleMs = 15 * 60 * 1000;
      const offsetMs = (rs.routeId * 3 + i * 5) * 60 * 1000;
      const timeSinceCycle = (Date.now() + offsetMs) % cycleMs;
      const msAway = cycleMs - timeSinceCycle;
      const minutesAway = Math.max(0, Math.floor(msAway / (60 * 1000)));

      return {
        routeId: rs.routeId,
        routeNumber: `${rs.routeId}`,
        routeName: `Route ${rs.routeId}`,
        minutesAway,
        vehicleId: `V${rs.routeId}-${i + 1}`,
        direction: i % 2 === 0 ? "Forward" : "Return",
      };
    });

    res.json({
      ...stop,
      lat: parseFloat(stop.lat),
      lng: parseFloat(stop.lng),
      arrivals,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stop");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vehicles
router.get("/vehicles", async (req, res) => {
  try {
    const { routeId } = req.query as { routeId?: string };
    const vehicles = routeId
      ? await db.select().from(vehiclesTable).where(eq(vehiclesTable.routeId, parseInt(routeId)))
      : await db.select().from(vehiclesTable);
    res.json(
      vehicles.map((v) => ({
        ...v,
        lat: parseFloat(v.lat),
        lng: parseFloat(v.lng),
        speed: parseFloat(v.speed),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list vehicles");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/summary
router.get("/dashboard/summary", async (req, res) => {
  try {
    const routes = await db.select().from(routesTable);
    const vehicles = await db.select().from(vehiclesTable);
    const stops = await db.select().from(stopsTable);

    const routesByType: Record<string, number> = { bus: 0, metro: 0, "suburban-rail": 0 };
    for (const r of routes) {
      routesByType[r.type] = (routesByType[r.type] ?? 0) + 1;
    }

    res.json({
      totalRoutes: routes.length,
      activeVehicles: vehicles.length,
      totalStops: stops.length,
      onTimePercentage: 82.5,
      routesByType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/favorites
router.get("/favorites", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const favorites = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, userId));
    const routes = favorites.filter((f) => f.itemType === "route");
    const stops = favorites.filter((f) => f.itemType === "stop");
    res.json({ routes, stops });
  } catch (err) {
    req.log.error({ err }, "Failed to list favorites");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites
router.post("/favorites", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { itemId, itemType, itemName } = req.body as { itemId: number; itemType: "route" | "stop"; itemName: string };
    const [favorite] = await db
      .insert(favoritesTable)
      .values({ userId, itemId, itemType, itemName })
      .returning();
    res.status(201).json(favorite);
  } catch (err) {
    req.log.error({ err }, "Failed to add favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/favorites/:id
router.delete("/favorites/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id);
    await db.delete(favoritesTable).where(and(eq(favoritesTable.id, id), eq(favoritesTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
