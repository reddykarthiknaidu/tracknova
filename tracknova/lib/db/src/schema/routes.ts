import { pgTable, serial, text, integer, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transportTypeEnum = pgEnum("transport_type", ["bus", "metro", "suburban-rail"]);
export const occupancyEnum = pgEnum("occupancy", ["low", "medium", "high"]);
export const favoriteTypeEnum = pgEnum("favorite_type", ["route", "stop"]);

export const routesTable = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: text("number").notNull(),
  type: transportTypeEnum("type").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  startStop: text("start_stop").notNull(),
  endStop: text("end_stop").notNull(),
  totalStops: integer("total_stops").notNull().default(0),
  frequency: text("frequency").notNull().default("Every 10 mins"),
  isActive: boolean("is_active").notNull().default(true),
});

export const stopsTable = pgTable("stops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  type: transportTypeEnum("type").notNull(),
  address: text("address"),
});

export const routeStopsTable = pgTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routesTable.id),
  stopId: integer("stop_id").notNull().references(() => stopsTable.id),
  sequence: integer("sequence").notNull(),
});

export const vehiclesTable = pgTable("vehicles", {
  id: text("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routesTable.id),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  speed: numeric("speed", { precision: 5, scale: 2 }).notNull().default("0"),
  direction: integer("direction").notNull().default(0),
  occupancy: occupancyEnum("occupancy").notNull().default("low"),
  lastUpdated: text("last_updated").notNull(),
});

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: integer("item_id").notNull(),
  itemType: favoriteTypeEnum("item_type").notNull(),
  itemName: text("item_name").notNull(),
});

export const insertRouteSchema = createInsertSchema(routesTable).omit({ id: true });
export const insertStopSchema = createInsertSchema(stopsTable).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({ id: true });

export type Route = typeof routesTable.$inferSelect;
export type Stop = typeof stopsTable.$inferSelect;
export type Vehicle = typeof vehiclesTable.$inferSelect;
export type Favorite = typeof favoritesTable.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type InsertStop = z.infer<typeof insertStopSchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
