import { useParams } from "wouter";
import {
  useGetRoute,
  useAddFavorite,
  useListFavorites,
  useRemoveFavorite,
  getListFavoritesQueryKey,
  getGetRouteQueryKey,
} from "@workspace/api-client-react";
import { useLiveVehicles } from "@/hooks/use-live-vehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Clock, Heart, Activity, Wifi } from "lucide-react";
import MapView from "@/components/map-view";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const routeId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: route, isLoading: routeLoading } = useGetRoute(routeId, {
    query: { enabled: !!routeId, queryKey: getGetRouteQueryKey(routeId) },
  });

  // Live SSE vehicle feed filtered to this route
  const { vehicles, status } = useLiveVehicles({ routeId });

  const { data: favorites } = useListFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const isFavorite = favorites?.routes.some((f) => f.itemId === routeId);
  const favoriteRecord = favorites?.routes.find((f) => f.itemId === routeId);

  const toggleFavorite = () => {
    if (isFavorite && favoriteRecord) {
      removeFav.mutate({ id: favoriteRecord.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Removed from favorites" });
        },
      });
    } else if (route) {
      addFav.mutate(
        { data: { itemId: routeId, itemType: "route", itemName: route.number } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
            toast({ title: "Added to favorites" });
          },
        },
      );
    }
  };

  if (routeLoading) return <Skeleton className="h-[600px] w-full" />;
  if (!route) return <div>Route not found</div>;

  return (
    <div className="space-y-6">
      {/* Route header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              style={{ backgroundColor: route.color ?? "var(--primary)" }}
              className="text-white text-lg px-3 py-1"
            >
              {route.number}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {route.type.replace("-", " ")}
            </Badge>
            {route.isActive ? (
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-0">
                Active Now
              </Badge>
            ) : (
              <Badge variant="secondary">Offline</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{route.name}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {route.startStop}
            <ArrowRight className="h-3 w-3" />
            {route.endStop}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{route.frequency}</span>
          </div>
          <Button
            variant={isFavorite ? "default" : "outline"}
            size="icon"
            onClick={toggleFavorite}
            disabled={addFav.isPending || removeFav.isPending}
            data-testid="button-favorite"
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-2 flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
              <Activity className="h-4 w-4" />
              Live Tracking
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-green-500" : "bg-yellow-500"}`} />
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} on route
            </div>
            {status === "connected" && (
              <div className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Wifi className="h-3 w-3" />
                Streaming
              </div>
            )}
          </div>

          <MapView
            stops={route.stops}
            vehicles={vehicles}
            route={route}
            className="h-[500px] w-full rounded-xl border border-border"
          />
        </div>

        {/* Stops list */}
        <div className="bg-card border border-border rounded-xl flex flex-col h-[560px]">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Route Stops ({route.stops.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {route.stops.map((stop, i) => (
              <div key={stop.id} className="flex gap-4 relative">
                {i < route.stops.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border" />
                )}
                <div className="mt-1 relative z-10">
                  <div
                    className={`h-6 w-6 rounded-full border-4 border-background shadow-sm flex items-center justify-center ${
                      i === 0
                        ? "bg-green-500"
                        : i === route.stops.length - 1
                        ? "bg-red-500"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                </div>
                <div className="pb-2">
                  <div className="font-medium text-sm">{stop.name}</div>
                  {stop.address && (
                    <div className="text-xs text-muted-foreground">{stop.address}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
