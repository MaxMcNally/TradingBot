import React, { useState } from "react";
import { signup, verify2FAAfterLogin, requestPasswordReset } from "../../api";
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
import { Login as LoginIcon, PersonAdd } from "@mui/icons-material";
import { LoginFormData } from "./Login.types";
import { useUser } from "../../hooks";

const Login: React.FC = () => {
  const { login, isLoading: userLoading, error: userError } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    email: ""
  });
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [twoFAToken, setTwoFAToken] = useState<string>("");
  const [forgotMode, setForgotMode] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError("Username and password are required");
      return;
    }

    if (isSignup && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (forgotMode) {
        await requestPasswordReset(formData.username || formData.email);
        setError("");
        setSuccessMessage("If the account exists, a reset link was sent.");
        setForgotMode(false);
      } else if (requires2FA) {
        if (!twoFAToken) {
          setError("Enter your 2FA code");
        } else {
          const res = await verify2FAAfterLogin(formData.username, twoFAToken);
          localStorage.setItem('authToken', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setError("");
        }
      } else if (isSignup) {
        const requestData = { username: formData.username, password: formData.password, email: formData.email };
        await signup(requestData);
        setError("");
        // After successful signup, automatically log in
        await login(formData.username, formData.password);
      } else {
        // Call login; if backend indicates 2FA required, show 2FA field
        try {
          await login(formData.username, formData.password);
          setError("");
        } catch (err: any) {
          const resp = err.response?.data;
          if (resp?.requires2fa) {
            setRequires2FA(true);
            setError("");
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (): void => {
    setIsSignup(!isSignup);
    setError("");
    setFormData({ username: "", password: "", email: "" });
    setRequires2FA(false);
    setTwoFAToken("");
    setForgotMode(false);
  };

  const [successMessage, setSuccessMessage] = useState<string>("");

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
          {isSignup ? (
            <PersonAdd sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          ) : (
            <LoginIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          )}
          <Typography variant="h4" component="h1" gutterBottom>
            {isSignup ? "Create Account" : "Welcome Back"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSignup 
              ? "Sign up to start trading with our platform" 
              : "Sign in to your trading account"
            }
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

          {isSignup && (
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
          )}

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete={isSignup ? "new-password" : "current-password"}
            helperText={isSignup ? "Must be at least 6 characters" : ""}
          />

          {requires2FA && !isSignup && (
            <TextField
              fullWidth
              label="2FA Code"
              value={twoFAToken}
              onChange={(e) => setTwoFAToken(e.target.value)}
              margin="normal"
              disabled={isLoading}
              autoComplete="one-time-code"
            />
          )}

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
            {isLoading
              ? (isSignup ? "Creating Account..." : (forgotMode ? "Sending Reset..." : (requires2FA ? "Verifying..." : "Signing In...")))
              : (isSignup ? "Create Account" : (forgotMode ? "Send Reset Link" : (requires2FA ? "Verify 2FA" : "Sign In")))
            }
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </Typography>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={toggleMode}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {isSignup ? "Sign in here" : "Create one here"}
            </Link>
          </Box>

          {!isSignup && (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => { setForgotMode(!forgotMode); setError(""); setSuccessMessage(""); }}
                disabled={isLoading}
              >
                {forgotMode ? "Back to Sign In" : "Forgot password?"}
              </Link>
            </Box>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          )}
        </Box>

        {!isSignup && (
          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Demo Account:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Username: admin | Password: admin123
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Login;
