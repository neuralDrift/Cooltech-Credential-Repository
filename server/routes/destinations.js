// Destinations routes
// Website name, OU name, Division name
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import Division from "../models/Division.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const divisions = await Division.find()
      .populate("ouId", "name") // populate OU name
      .select("_id name ouId"); // include populated OU
    res.json({ destinations: divisions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
