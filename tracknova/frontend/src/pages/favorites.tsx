import { useListFavorites, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useListFavorites();
  const removeFav = useRemoveFavorite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRemove = (id: number) => {
    removeFav.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        toast({ title: "Removed from favorites" });
      }
    });
  };

  const hasFavorites = (favorites?.routes?.length || 0) > 0 || (favorites?.stops?.length || 0) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Favorites</h1>
        <p className="text-muted-foreground">Quick access to your saved routes and stops.</p>
      </div>

      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && !hasFavorites && (
        <div className="bg-card border border-border p-12 text-center rounded-2xl">
          <HeartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">Save routes and stops to access them quickly here.</p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/routes">Browse Routes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/stops">Browse Stops</Link>
            </Button>
          </div>
        </div>
      )}

      {!isLoading && (favorites?.routes?.length || 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" /> Saved Routes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites?.routes.map(fav => (
              <Card key={fav.id} className="group overflow-hidden">
                <CardContent className="p-0 flex">
                  <Link href={`/routes/${fav.itemId}`} className="flex-1 p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-primary-foreground h-10 w-10 rounded-lg flex items-center justify-center font-bold">
                        {fav.itemName}
                      </div>
                      <span className="font-medium flex items-center gap-1 group-hover:text-primary transition-colors">
                        View Route <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                  <div className="border-l border-border p-4 flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemove(fav.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (favorites?.stops?.length || 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 mt-8">
            <MapPin className="h-5 w-5 text-primary" /> Saved Stops
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites?.stops.map(fav => (
              <Card key={fav.id} className="group overflow-hidden">
                <CardContent className="p-0 flex">
                  <Link href={`/stops/${fav.itemId}`} className="flex-1 p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{fav.itemName}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        View Arrivals <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                  <div className="border-l border-border p-4 flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemove(fav.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HeartIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}