import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Backtesting from "./components/Backtesting";
import ThemeProvider from "./components/ThemeProvider";
function App() {
  const [user, setUser] = useState(null);

  if (!user) return <Login setUser={setUser} />;

  return (

    <Router>
    <ThemeProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/backtesting" element={<Backtesting />} />
        </Routes>
      </AppLayout>
      </ThemeProvider>
    </Router>
  );
}

export default App;
