import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Map, Bus, Train, Search, Heart, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live Track", href: "/track", icon: Map },
    { name: "Routes", href: "/routes", icon: Bus },
    { name: "Stops", href: "/stops", icon: Search },
    { name: "Favorites", href: "/favorites", icon: Heart },
  ];

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <nav className="grid gap-6 text-lg font-medium mt-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                <Bus className="h-6 w-6" />
                TrackNova
              </Link>
              <div className="grid gap-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-4 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-muted text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-xl font-bold text-primary mr-6">
          <Bus className="h-6 w-6" />
          TrackNova
        </Link>

        <nav className="hidden md:flex flex-1 items-center gap-6 text-sm font-medium">
          {navigation.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 ml-auto md:ml-0">
          {user && (
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-medium text-foreground">{user.fullName || user.username || 'Commuter'}</span>
              <span className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
