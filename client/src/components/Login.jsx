import React, { useState } from "react";
import { login, signup } from "../api";
import { TextField, Button, Box } from "@mui/material";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      const res = isSignup
        ? await signup({ username, password })
        : await login({ username, password });
      setUser(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Error");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: 300 }}>
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <Box sx={{ color: "red" }}>{error}</Box>}
      <Button variant="contained" onClick={handleSubmit}>{isSignup ? "Signup" : "Login"}</Button>
      <Button onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? "Already have an account?" : "Create account"}
      </Button>
    </Box>
  );
};

export default Login;
