import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { signup } from "../../api";
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
import { PersonAdd } from "@mui/icons-material";
import { SignupProps, SignupFormData, User } from "./Signup.types";

const Signup: React.FC<SignupProps> = ({ setUser, onSwitchToLogin }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, getValues } = useForm<SignupFormData>({
    defaultValues: { username: "", password: "", confirmPassword: "", email: "" },
    mode: "onChange",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async (data: SignupFormData): Promise<void> => {
    if (!data.username || !data.password) {
      setError("Username and password are required");
      return;
    }
    if (data.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await signup({ username: data.username, password: data.password, email: data.email });
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      setUser(res.data.user);
      if ((res.data as any).emailVerificationRequired) {
        alert('Please verify your email address. Check your inbox.');
      }
      setError("");
    } catch (err: any) {
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

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Username"
            {...register("username", { required: true })}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="username"
            error={!!errors.username}
            helperText={errors.username ? "Username is required" : ""}
          />

          <TextField
            fullWidth
            label="Email (Optional)"
            type="email"
            {...register("email")}
            margin="normal"
            disabled={isLoading}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            {...register("password", { required: true, minLength: 6 })}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password ? "Must be at least 6 characters" : "Must be at least 6 characters"}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            {...register("confirmPassword", { required: true, validate: (v) => v === getValues("password") })}
            margin="normal"
            required
            disabled={isLoading}
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword ? "Passwords must match" : ""}
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
