// OU routes
import express from "express";
import { getAllOUs, addOU, deleteOU } from "../controllers/ouController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public: List Organisational Units
router.get("/", authMiddleware, getAllOUs);

// Admin only: add or delete OUs
router.post("/", authMiddleware, roleMiddleware(["admin"]), addOU);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteOU);

export default router;
