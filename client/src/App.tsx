import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login-page";
import LogoutPage from "@/pages/logout-page";
import VehicleDetailPage from "@/pages/vehicle-detail-page";
import RequestInfoPage from "@/pages/request-info-page";
import CatalogPage from "@/pages/catalog-page";
import DashboardPage from "@/pages/admin/dashboard";
import VehiclesPage from "@/pages/admin/vehicles";
import VehicleEditPage from "@/pages/admin/vehicle-edit";
import RentalOptionEditPage from "@/pages/admin/rental-option-edit";
import BrandsCategoriesPage from "@/pages/admin/brands-categories";
import RequestsPage from "@/pages/admin/requests";
import UsersPage from "@/pages/admin/users";
import SettingsPage from "@/pages/admin/settings";
import PromoManagementPage from "@/pages/admin/promo-management";
import IntegrationsPage from "@/pages/admin/integrations";

import TwoFactorSetupPage from "@/pages/admin/two-factor-setup-page";
import TwoFactorSetupNewPage from "@/pages/admin/two-factor-setup-new-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AuthWrapper } from "@/components/auth-wrapper";
import PageTitle from "@/components/page-title";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={LoginPage} />
      <Route path="/logout" component={LogoutPage} />
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/vehicle/:id" component={VehicleDetailPage} />
      <Route path="/request-info/:vehicleId/:rentalOptionId?" component={RequestInfoPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={DashboardPage} />
      <ProtectedRoute path="/admin/vehicles" component={VehiclesPage} />
      <ProtectedRoute path="/admin/vehicles/new" component={VehicleEditPage} />
      <ProtectedRoute path="/admin/vehicles/:id/edit" component={VehicleEditPage} />
      <ProtectedRoute path="/admin/vehicles/:vehicleId/rental-options/:optionId" component={RentalOptionEditPage} />
      <ProtectedRoute path="/admin/brands-categories" component={BrandsCategoriesPage} />
      <ProtectedRoute path="/admin/requests" component={RequestsPage} />
      <ProtectedRoute path="/admin/users" component={UsersPage} />
      <ProtectedRoute path="/admin/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin/promos" component={PromoManagementPage} />
      <ProtectedRoute path="/admin/integrations" component={IntegrationsPage} />

      <ProtectedRoute path="/admin/two-factor-setup" component={TwoFactorSetupPage} />
      <ProtectedRoute path="/admin/two-factor-setup-new" component={TwoFactorSetupNewPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <ThemeProvider>
            <AuthWrapper>
              <Router />
            </AuthWrapper>
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
