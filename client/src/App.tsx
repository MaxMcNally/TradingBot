import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard";
import Trading from "./components/Trading/Trading";
import Settings from "./components/Settings";
import Backtesting from "./components/Backtesting/Backtesting";
import { Strategies } from "./components/Strategies";
import { StrategiesMarketplace } from "./components/StrategiesMarketplace";
import Pricing from "./components/Pricing/Pricing";
import Checkout from "./components/Checkout/Checkout";
import { AdminDashboard, AdminRoute } from "./components/Admin";
import ThemeProvider from "./components/ThemeProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { useUser } from "./hooks";

const AppContent: React.FC = () => {
  const { user, logout } = useUser();

  if (!user) return <Login />;

  return (
    <Router>
      <ThemeProvider>
        <AppLayout
          header={<Header user={user} onLogout={logout} />}
          footer={<Footer user={user} />}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/marketplace" element={<StrategiesMarketplace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
          </Routes>
        </AppLayout>
      </ThemeProvider>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
};

export default App;
