import { useState } from "react";
import { useListRoutes, RouteType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Train, TramFront, Search, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoutesListPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<RouteType | "">("");

  const { data: routes, isLoading } = useListRoutes(
    { search: search || undefined, type: type || undefined }
  );

  const getIcon = (rtType: string) => {
    if (rtType === 'metro') return <Train className="h-5 w-5" />;
    if (rtType === 'suburban-rail') return <TramFront className="h-5 w-5" />;
    return <Bus className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
        <p className="text-muted-foreground">Browse and search all Chennai transit routes.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by route number or name..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-routes"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={type === "" ? "default" : "outline"} 
            onClick={() => setType("")}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={type === "bus" ? "default" : "outline"} 
            onClick={() => setType("bus")}
            size="sm"
          >
            Bus
          </Button>
          <Button 
            variant={type === "metro" ? "default" : "outline"} 
            onClick={() => setType("metro")}
            size="sm"
          >
            Metro
          </Button>
          <Button 
            variant={type === "suburban-rail" ? "default" : "outline"} 
            onClick={() => setType("suburban-rail")}
            size="sm"
          >
            Suburban
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}

        {!isLoading && routes?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No routes found matching your criteria.
          </div>
        )}

        {!isLoading && routes?.map((route) => (
          <Card key={route.id} className="hover:border-primary/50 transition-colors group cursor-pointer overflow-hidden">
            <Link href={`/routes/${route.id}`}>
              <CardContent className="p-0">
                <div 
                  className="h-2 w-full" 
                  style={{ backgroundColor: route.color || 'var(--primary)' }} 
                />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-md text-foreground">
                        {getIcon(route.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" data-testid={`text-route-${route.id}`}>{route.number}</h3>
                        <Badge variant="secondary" className="text-xs uppercase">{route.type.replace('-', ' ')}</Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-sm font-medium line-clamp-1">{route.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                    <span>{route.totalStops} stops</span>
                    <span>Every {route.frequency}</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}