/**
 * Server-Sent Events endpoint for real-time vehicle positions.
 * GET /api/vehicles/live  — streams LiveVehicle[] updates every TICK_MS.
 */

import { Router } from "express";
import { vehicleSimulator, TICK_MS } from "../services/vehicleSimulator";

const router = Router();

router.get("/vehicles/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Send current snapshot immediately so the client doesn't wait
  const initial = vehicleSimulator.getSnapshot();
  res.write(`data: ${JSON.stringify(initial)}\n\n`);

  // Send a heartbeat comment every 20 s to keep the connection alive through proxies
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20_000);

  const onUpdate = (vehicles: unknown) => {
    res.write(`data: ${JSON.stringify(vehicles)}\n\n`);
  };

  vehicleSimulator.on("update", onUpdate);

  req.on("close", () => {
    vehicleSimulator.off("update", onUpdate);
    clearInterval(heartbeat);
    req.log.info("SSE client disconnected");
  });

  req.log.info("SSE client connected");
});

// Keep the REST poll endpoint too for non-SSE consumers
router.get("/vehicles/snapshot", (_req, res) => {
  res.json(vehicleSimulator.getSnapshot());
});

export { TICK_MS };
export default router;
