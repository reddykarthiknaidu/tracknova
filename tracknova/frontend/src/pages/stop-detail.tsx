import { useParams } from "wouter";
import { useGetStop, useAddFavorite, useListFavorites, useRemoveFavorite, getListFavoritesQueryKey, getGetStopQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Heart, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function StopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const stopId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stop, isLoading } = useGetStop(stopId, {
    query: { enabled: !!stopId, refetchInterval: 10000, queryKey: getGetStopQueryKey(stopId) }
  });

  const { data: favorites } = useListFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const isFavorite = favorites?.stops.some(f => f.itemId === stopId);
  const favoriteRecord = favorites?.stops.find(f => f.itemId === stopId);

  const toggleFavorite = () => {
    if (isFavorite && favoriteRecord) {
      removeFav.mutate({ id: favoriteRecord.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Removed from favorites" });
        }
      });
    } else if (stop) {
      addFav.mutate({ data: { itemId: stopId, itemType: "stop", itemName: stop.name } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Added to favorites" });
        }
      });
    }
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (!stop) return <div>Stop not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex gap-4">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{stop.name}</h1>
            <div className="text-sm text-muted-foreground">{stop.address || "Chennai"}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary" className="uppercase">{stop.type.replace('-', ' ')}</Badge>
            </div>
          </div>
        </div>
        
        <Button 
          variant={isFavorite ? "default" : "outline"} 
          onClick={toggleFavorite}
          disabled={addFav.isPending || removeFav.isPending}
          data-testid="button-favorite-stop"
        >
          <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          {isFavorite ? "Saved" : "Save Stop"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Live Arrivals
        </h2>
        
        {stop.arrivals.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center rounded-xl text-muted-foreground">
            No upcoming arrivals in the near future.
          </div>
        ) : (
          <div className="grid gap-3">
            {stop.arrivals.sort((a,b) => a.minutesAway - b.minutesAway).map((arrival, i) => (
              <Card key={`${arrival.vehicleId}-${i}`} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-lg px-3 py-1">
                      {arrival.routeNumber}
                    </Badge>
                    <div>
                      <div className="font-bold text-base">{arrival.routeName}</div>
                      <div className="text-xs text-muted-foreground">Towards {arrival.direction || 'Destination'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-extrabold ${arrival.minutesAway <= 5 ? 'text-green-500 animate-pulse' : 'text-foreground'}`}>
                        {arrival.minutesAway === 0 ? 'Due' : `${arrival.minutesAway} min`}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        {arrival.minutesAway <= 5 ? 'Approaching' : 'Estimated'}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/routes/${arrival.routeId}`}>
                        <Bus className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}