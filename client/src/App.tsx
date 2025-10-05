import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Backtesting from "./components/Backtesting/Backtesting";
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
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="/backtesting" element={<Backtesting />} />
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
