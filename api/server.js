import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.url);
  
  // Log what origin is sent by the browser
  console.log("Origin header:", req.headers.origin);

  // Log what CORS headers we are sending back
  res.on("finish", () => {
    console.log("CORS headers set:");
    console.log("  Access-Control-Allow-Origin:", res.getHeader("Access-Control-Allow-Origin"));
    console.log("  Access-Control-Allow-Credentials:", res.getHeader("Access-Control-Allow-Credentials"));
  });

  next();
});
// ✅ Enable CORS properly
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://127.0.0.1:5173", // Alternate local URL
      process.env.FRONTEND_URL, // Optional for deployed frontend
    ],
    credentials: true, // Allow cookies and auth headers
  })
);

app.use(bodyParser.json());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.get("/ping", (req, res) => {
  console.log("Ping route hit ✅");
  res.json({ status: "ok" });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
