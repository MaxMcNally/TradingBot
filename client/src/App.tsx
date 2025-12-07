import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { MainLayout } from "./Layouts";
import {
  SplashPage,
  LoginPage,
  DashboardPage,
  TradingPage,
  SettingsPage,
  BacktestingPage,
  StrategiesPage,
  StrategiesMarketplacePage,
  PricingPage,
  CheckoutPage,
  AdminDashboardPage,
  AboutPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  SupportPage,
} from "./Pages";
import { AdminRoute, SubscriptionManagement } from "./Pages/Admin";
import ThemeProvider from "./providers/ThemeProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { useUser } from "./hooks";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return <SplashPage />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, logout } = useUser();

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              <MainLayout user={user} onLogout={logout}>
                <DashboardPage />
              </MainLayout>
            ) : (
              <MainLayout user={null} onLogout={logout}>
                <SplashPage />
              </MainLayout>
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            <MainLayout user={null} onLogout={logout}>
              <LoginPage />
            </MainLayout>
          } 
        />
        <Route
          path="/trading"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <TradingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <SettingsPage user={user!} />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backtesting"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <BacktestingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategies"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <StrategiesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <StrategiesMarketplacePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <PricingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <CheckoutPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute>
              <MainLayout user={user!} onLogout={logout}>
                <AdminRoute>
                  <SubscriptionManagement />
                </AdminRoute>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <MainLayout user={user} onLogout={logout}>
              <AboutPage />
            </MainLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <MainLayout user={user} onLogout={logout}>
              <PrivacyPolicyPage />
            </MainLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <MainLayout user={user} onLogout={logout}>
              <TermsOfServicePage />
            </MainLayout>
          }
        />
        <Route
          path="/support"
          element={
            <MainLayout user={user} onLogout={logout}>
              <SupportPage />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>

    </QueryProvider>
  );
};

export default App;
