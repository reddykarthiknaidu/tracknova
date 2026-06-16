import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bus, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Chennai transit network at a glance.</p>
        </div>
        <Button asChild data-testid="button-live-map">
          <Link href="/track">Live Map</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold" data-testid="stat-vehicles">{summary?.activeVehicles || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently on the move</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold" data-testid="stat-routes">{summary?.totalRoutes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all transport modes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Stops</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold" data-testid="stat-stops">{summary?.totalStops || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Stations and bus stops</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Reliability</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-primary" data-testid="stat-ontime">{summary?.onTimePercentage || 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
             <Button variant="outline" className="h-24 w-full sm:w-48 flex-col gap-2" asChild>
                <Link href="/routes">
                  <Bus className="h-6 w-6 text-blue-500" />
                  Browse Routes
                </Link>
             </Button>
             <Button variant="outline" className="h-24 w-full sm:w-48 flex-col gap-2" asChild>
                <Link href="/stops">
                  <MapPin className="h-6 w-6 text-green-500" />
                  Find Stops
                </Link>
             </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle>Network Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {isLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
               </div>
             ) : (
               <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><Bus className="h-4 w-4 text-blue-500"/> MTC Bus</span>
                    <span className="font-semibold">{summary?.routesByType?.bus || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><Bus className="h-4 w-4 text-purple-500"/> Metro</span>
                    <span className="font-semibold">{summary?.routesByType?.metro || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><Bus className="h-4 w-4 text-orange-500"/> Suburban</span>
                    <span className="font-semibold">{summary?.routesByType?.['suburban-rail'] || 0}</span>
                  </div>
               </>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}