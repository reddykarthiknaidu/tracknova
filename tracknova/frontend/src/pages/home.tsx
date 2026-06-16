import { Link } from "wouter";
import { ArrowRight, Activity, Map, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center max-w-4xl mx-auto px-4 py-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 text-sm font-semibold tracking-tight border border-primary/20">
        <Activity className="h-4 w-4" />
        Live Chennai Transit
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-foreground text-balance">
        Navigate Chennai with <span className="text-primary">Confidence</span>.
      </h1>
      
      <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
        Real-time tracking for MTC buses, Metro, and Suburban Rail. Your definitive urban companion for a faster, smarter commute.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform" data-testid="button-get-started">
          <Link href="/sign-up">
            Start Tracking
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl border-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" data-testid="button-sign-in" id="login-button">
          <Link href="/sign-in">
            Sign In
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12 text-left">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Map className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Live Positions</h3>
          <p className="text-muted-foreground">Track exact vehicle locations on an interactive city map. Never miss a ride.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Accurate ETAs</h3>
          <p className="text-muted-foreground">Get up-to-the-minute arrival times for your stops, adjusted for traffic.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">All Transport Modes</h3>
          <p className="text-muted-foreground">MTC buses, Chennai Metro, and Suburban Rail—all in one unified view.</p>
        </div>
      </div>
    </div>
  );
}