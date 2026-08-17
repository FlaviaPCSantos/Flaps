import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminLoginForm from "./pages/AdminLoginForm";
import { AccountSettings } from "./pages/AccountSettings";
import About from "./pages/About";
import Novidades from "./pages/Novidades";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/novidades" component={Novidades} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/sobre" component={About} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/login-form" component={AdminLoginForm} />
      <Route path="/admin/settings" component={AccountSettings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
