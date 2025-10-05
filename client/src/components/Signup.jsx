import React, { useState } from "react";
import { signup } from "../api";
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Link
} from "@mui/material";
import { PersonAdd, Login as LoginIcon } from "@mui/icons-material";

const Signup = ({ setUser, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError("Username and password are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await signup({
        username: formData.username,
        password: formData.password,
        email: formData.email
      });
      
      // Store token and user data
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      
      setUser(res.data.user);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <PersonAdd sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign up to start trading with our platform
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={handleInputChange("username")}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="Email (Optional)"
            type="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            margin="normal"
            disabled={isLoading}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="new-password"
            helperText="Must be at least 6 characters"
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="new-password"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToLogin}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              Sign in here
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
