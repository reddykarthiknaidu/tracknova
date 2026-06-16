import { useState, useMemo } from "react";
import { useListRoutes, useListStops } from "@workspace/api-client-react";
import { useLiveVehicles } from "@/hooks/use-live-vehicles";
import MapView from "@/components/map-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TrackMapPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>();
  const [search, setSearch] = useState("");

  const { vehicles, status, lastUpdated } = useLiveVehicles({ routeId: selectedRouteId });
  const { data: routes } = useListRoutes();
  const { data: stops } = useListStops();

  const visibleStops = useMemo(() => {
    if (!Array.isArray(stops)) return [];
    if (selectedRouteId) return stops.filter((s) => s.routeIds?.includes(selectedRouteId));
    return stops;
  }, [stops, selectedRouteId]);

  const filteredRoutes = useMemo(() => {
    if (!Array.isArray(routes)) return [];
    if (!search.trim()) return routes;
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.number.toLowerCase().includes(search.toLowerCase()),
    );
  }, [routes, search]);

  const statusConfig = {
    connecting:   { icon: RefreshCw, label: "Connecting...",  cls: "text-yellow-600 border-yellow-500/30 bg-yellow-500/10" },
    connected:    { icon: Wifi,      label: "Live",           cls: "text-green-600 border-green-500/30 bg-green-500/10 dark:text-green-400" },
    reconnecting: { icon: RefreshCw, label: "Reconnecting...", cls: "text-orange-600 border-orange-500/30 bg-orange-500/10" },
    error:        { icon: WifiOff,   label: "Disconnected",   cls: "text-red-600 border-red-500/30 bg-red-500/10" },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} active
            {lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`gap-2 px-3 py-1 ${statusConfig.cls}`}
          data-testid="badge-connection-status"
        >
          {status === "connected" ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          ) : (
            <StatusIcon className="h-3 w-3 animate-spin" />
          )}
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar: route filter */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter routes..."
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-route-search"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <Button
              variant={selectedRouteId === undefined ? "default" : "ghost"}
              className="w-full justify-start text-sm h-9"
              onClick={() => setSelectedRouteId(undefined)}
              data-testid="button-route-all"
            >
              All routes
            </Button>

            {filteredRoutes.map((route) => {
              const routeVehicleCount = vehicles.filter((v) => v.routeId === route.id).length;
              return (
                <Button
                  key={route.id}
                  variant={selectedRouteId === route.id ? "secondary" : "ghost"}
                  className="w-full justify-between text-sm h-9 px-3"
                  onClick={() =>
                    setSelectedRouteId(route.id === selectedRouteId ? undefined : route.id)
                  }
                  data-testid={`button-route-${route.id}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: route.color }}
                    />
                    <span className="font-mono font-semibold text-xs">{route.number}</span>
                    <span className="truncate text-muted-foreground">{route.startStop.split(" ")[0]}</span>
                  </span>
                  {routeVehicleCount > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1 flex-shrink-0">
                      {routeVehicleCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="bg-card border border-border rounded-xl p-3 flex-shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legend</div>
            <div className="space-y-1.5">
              {[
                { color: "bg-green-500", label: "Low occupancy" },
                { color: "bg-yellow-500", label: "Medium occupancy" },
                { color: "bg-red-500", label: "High occupancy" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs pt-1 border-t border-border mt-1">
                <div className="h-2 w-2 rounded-full bg-zinc-900 border border-white" />
                <span>Stop / Station</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <Card className="flex-1 overflow-hidden border-border shadow-xl">
          <MapView
            vehicles={vehicles}
            stops={visibleStops}
            className="h-full w-full"
            zoom={selectedRouteId ? 13 : 12}
          />
        </Card>
      </div>
    </div>
  );
}
