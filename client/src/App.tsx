import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ScanProvider } from "@/context/ScanContext";
import { ProtectedRoute } from "@/lib/protected-route";

// Import pages
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ScanDetailPage from "@/pages/scan-detail-page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard">
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
      </Route>
      <Route path="/scans/:id">
        <ProtectedRoute path="/scans/:id" component={ScanDetailPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScanProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Route path="/auth">
              {() => null}
            </Route>
            <Route path="*">
              {() => <Header />}
            </Route>
            <main className="flex-grow">
              <Router />
            </main>
            <Route path="*">
              {() => <Footer />}
            </Route>
          </div>
          <Toaster />
        </ScanProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
