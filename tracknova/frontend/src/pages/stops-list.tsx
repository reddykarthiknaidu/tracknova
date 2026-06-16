import { useState } from "react";
import { useListStops, StopType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Navigation } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function StopsListPage() {
  // We use local filtering for now since the API only accepts lat/lng/radius
  // In a real app we'd have a search endpoint or query param.
  const [search, setSearch] = useState("");

  const { data: stops, isLoading } = useListStops();

  const filteredStops = stops?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stops & Stations</h1>
        <p className="text-muted-foreground">Find stops, stations, and check upcoming arrivals.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search for a stop..." 
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-stops"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}

        {!isLoading && filteredStops.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No stops found. Try a different search term.
          </div>
        )}

        {!isLoading && filteredStops.map((stop) => (
          <Card key={stop.id} className="hover:border-primary/50 transition-colors group">
            <Link href={`/stops/${stop.id}`}>
              <CardContent className="p-4 flex gap-4 h-full cursor-pointer">
                <div className="mt-1 bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2" data-testid={`text-stop-${stop.id}`}>
                    {stop.name}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {stop.address || "Chennai"}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    <Navigation className="h-3 w-3" />
                    View Arrivals
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