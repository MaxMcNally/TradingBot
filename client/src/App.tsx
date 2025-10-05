import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Backtesting from "./components/Backtesting";
import ThemeProvider from "./components/ThemeProvider";
import { User } from "./components/Login/Login.types";
import { logout } from "./api";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  if (!user) return <Login setUser={setUser} />;

  return (
    <Router>
      <ThemeProvider>
        <AppLayout
          header={<Header user={user} onLogout={handleLogout} />}
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

export default App;
