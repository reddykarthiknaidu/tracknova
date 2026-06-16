import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
import Layout from "@/components/layout";

// Pages
import HomePage from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import RoutesPage from "@/pages/routes-list";
import RouteDetailPage from "@/pages/route-detail";
import StopsPage from "@/pages/stops-list";
import StopDetailPage from "@/pages/stop-detail";
import TrackMapPage from "@/pages/track-map";
import FavoritesPage from "@/pages/favorites";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(24 95% 53%)",
    colorForeground: "hsl(240 10% 4%)",
    colorMutedForeground: "hsl(240 5% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(240 5% 96%)",
    colorInputForeground: "hsl(240 10% 4%)",
    colorNeutral: "hsl(240 5% 90%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white dark:bg-zinc-950 rounded-2xl w-[440px] max-w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50",
    headerSubtitle: "text-zinc-500 dark:text-zinc-400",
    socialButtonsBlockButtonText: "text-zinc-900 dark:text-zinc-100 font-medium",
    formFieldLabel: "text-sm font-medium text-zinc-950 dark:text-zinc-50",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-zinc-500 dark:text-zinc-400",
    dividerText: "text-zinc-500 dark:text-zinc-400 text-xs font-medium",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-600 dark:text-green-400",
    alertText: "text-sm text-red-600 dark:text-red-400",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium h-10",
    formFieldInput: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 h-10",
    footerAction: "mt-6",
    dividerLine: "bg-zinc-200 dark:bg-zinc-800",
    alert: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10",
    otpCodeFieldInput: "border-zinc-200 dark:border-zinc-800",
    formFieldRow: "mb-4",
    main: "gap-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4" data-testid="page-signin">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4" data-testid="page-signup">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        {children}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard">
              <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/routes">
              <ProtectedRoute><Layout><RoutesPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/routes/:id">
              <ProtectedRoute><Layout><RouteDetailPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/stops">
              <ProtectedRoute><Layout><StopsPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/stops/:id">
              <ProtectedRoute><Layout><StopDetailPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/track">
              <ProtectedRoute><Layout><TrackMapPage /></Layout></ProtectedRoute>
            </Route>
            <Route path="/favorites">
              <ProtectedRoute><Layout><FavoritesPage /></Layout></ProtectedRoute>
            </Route>
            
            <Route>
              <Layout><NotFound /></Layout>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath} hook={useHashLocation}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
