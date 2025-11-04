// Express API entry point:
// - Sets up security, JSON parsing, CORS
// - Registers routes for users, credentials, divisions, membership, OUs, destinations
// - Connects to MongoDB and starts the HTTP server
// Import middleware
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";

// Import routes
import credentialRoutes from "./routes/credential.js";
import divisionRoutes from "./routes/division.js";
import memberRoutes from "./routes/membership.js";
import ouRoutes from "./routes/ou.js";
import userRoutes from "./routes/users.js";
import destinationRoutes from "./routes/destinations.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/divisions", divisionRoutes);
app.use("/api/membership", memberRoutes);
app.use("/api/ous", ouRoutes);
app.use("/api/destinations", destinationRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Backend running check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
