import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory or fallback to root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
app.set("port", PORT);

// Configure CORS for production and development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with any origin (mirrors request origin) to support Netlify, Vercel, Render, and local dev
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token", "x-requested-with"],
  })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Health check and root endpoints for deployment monitors (Render/Railway/Fly)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Connecto Backend API is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/v1/users", userRoutes);

const start = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("FATAL ERROR: MONGO_URI is not defined in environment variables!");
    console.error("Please add MONGO_URI to your .env file or hosting provider's Environment Variables settings.");
    process.exit(1);
  }

  try {
    const connectionDb = await mongoose.connect(mongoUri);
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
  } catch (error) {
    console.error("FATAL: MongoDB connection failed:", error.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`LISTENING ON PORT ${PORT}`);
  });
};

start();
