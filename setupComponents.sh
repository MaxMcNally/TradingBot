#!/bin/bash

# Exit on error
set -e

COMPONENTS_DIR="client/src/components"

echo "Creating components directory if it doesn't exist..."
mkdir -p $COMPONENTS_DIR

echo "Creating React components..."

# Dashboard component
cat > $COMPONENTS_DIR/Dashboard.jsx <<EOL
import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
};

export default Dashboard;
EOL

# Settings component
cat > $COMPONENTS_DIR/Settings.jsx <<EOL
import React from 'react';

const Settings = () => {
  return (
    <div>
      <h1>Settings</h1>
      <p>Manage your application settings here.</p>
    </div>
  );
};

export default Settings;
EOL

# Login component
cat > $COMPONENTS_DIR/Login.jsx <<EOL
import React, { useState } from 'react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: handle login logic
    console.log('Logging in', { username, password });
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
EOL

# Backtesting component
cat > $COMPONENTS_DIR/Backtesting.jsx <<EOL
import React from 'react';

const Backtesting = () => {
  return (
    <div>
      <h1>Backtesting</h1>
      <p>Run your strategies and see historical results.</p>
    </div>
  );
};

export default Backtesting;
EOL

echo "All components have been created successfully!"
