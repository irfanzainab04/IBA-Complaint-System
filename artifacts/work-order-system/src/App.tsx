import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setupFetchInterceptor } from "./lib/fetch-interceptor";
import { useAuth } from "./hooks/use-auth";

import { AppLayout } from "./components/layout/app-layout";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import Dashboard from "./pages/dashboard";
import WorkOrdersList from "./pages/work-orders/list";
import CreateWorkOrder from "./pages/work-orders/create";
import WorkOrderDetail from "./pages/work-orders/detail";
import Notifications from "./pages/notifications";
import NotFound from "@/pages/not-found";

// Initialize the fetch interceptor so @workspace/api-client-react hooks send the token
setupFetchInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/login" && location !== "/register") {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading || (!isAuthenticated && location !== "/login" && location !== "/register")) {
    return null; // Layout handles the loading spinner
  }

  return <>{children}</>;
}

function ProtectedRoutes() {
  return (
    <AppLayout>
      <AuthGuard>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/work-orders" component={WorkOrdersList} />
          <Route path="/work-orders/new" component={CreateWorkOrder} />
          <Route path="/work-orders/:id" component={WorkOrderDetail} />
          <Route path="/notifications" component={Notifications} />
          <Route component={NotFound} />
        </Switch>
      </AuthGuard>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route component={ProtectedRoutes} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
