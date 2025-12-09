import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    defaultValues: { username: "", password: "", email: "" },
    mode: "onChange",
  });
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [twoFAToken, setTwoFAToken] = useState<string>("");
  const [forgotMode, setForgotMode] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && user.id) {
      navigate("/");
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    if (!data.username || !data.password) {
      setError("Username and password are required");
      return;
    }

    if (isSignup && data.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (forgotMode) {
        await requestPasswordReset(data.username || data.email || "");
        setError("");
        setSuccessMessage("If the account exists, a reset link was sent.");
        setForgotMode(false);
      } else if (requires2FA) {
        if (!twoFAToken) {
          setError("Enter your 2FA code");
        } else {
          const res = await verify2FAAfterLogin(data.username, twoFAToken);
          if (res.data.data) {
            localStorage.setItem('authToken', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            // Redirect after 2FA verification
            navigate("/");
          }
          setError("");
        }
      } else if (isSignup) {
        const requestData = { username: data.username, password: data.password, email: data.email };
        await signup(requestData);
        setError("");
        await login(data.username, data.password);
        // Redirect after signup and login
        navigate("/");
      } else {
        try {
          await login(data.username, data.password);
          setError("");
          // Redirect after successful login
          navigate("/");
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
    reset({ username: "", password: "", email: "" });
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

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Username"
            {...register("username", { required: !forgotMode })}
            margin="normal"
            required={!forgotMode}
            disabled={isLoading}
            autoComplete="username"
            error={!!errors.username}
            helperText={errors.username ? "Username is required" : ""}
          />

          {isSignup && (
            <TextField
              fullWidth
              label="Email (Optional)"
              type="email"
              {...register("email")}
              margin="normal"
              disabled={isLoading}
              autoComplete="email"
            />
          )}

          <TextField
            fullWidth
            label="Password"
            type="password"
            {...register("password", { required: !forgotMode, minLength: isSignup ? 6 : undefined })}
            margin="normal"
            required={!forgotMode}
            disabled={isLoading}
            autoComplete={isSignup ? "new-password" : "current-password"}
            error={!!errors.password}
            helperText={isSignup ? "Must be at least 6 characters" : errors.password ? "Password is required" : ""}
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

export default LoginPage;

