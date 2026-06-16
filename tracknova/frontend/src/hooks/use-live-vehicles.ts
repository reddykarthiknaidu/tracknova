/**
 * uselivevehicles — subscribes to the /api/vehicles/live SSE stream
 * and returns the latest array of live vehicle positions.
 *
 * Falls back to an empty array while connecting and automatically
 * reconnects if the stream drops.
 */

import { useState, useEffect, useRef, useCallback } from "react";

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

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

interface UseLiveVehiclesOptions {
  routeId?: number;
}

export function useLiveVehicles({ routeId }: UseLiveVehiclesOptions = {}) {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    setStatus(retryCount.current > 0 ? "reconnecting" : "connecting");

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const es = new EventSource(`${base}/api/vehicles/live`);
    esRef.current = es;

    es.onopen = () => {
      setStatus("connected");
      retryCount.current = 0;
    };

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const data: LiveVehicle[] = JSON.parse(event.data);
        const filtered = routeId != null ? data.filter((v) => v.routeId === routeId) : data;
        setVehicles(filtered);
        setLastUpdated(new Date());
        setStatus("connected");
      } catch {
        // malformed frame — ignore
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setStatus("reconnecting");
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current++;
      retryRef.current = setTimeout(connect, delay);
    };
  }, [routeId]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { vehicles, status, lastUpdated };
}
