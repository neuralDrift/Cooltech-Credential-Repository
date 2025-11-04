// Division routes
import express from "express";
import {
  getAllDivisions,
  addDivision,
  deleteDivision,
} from "../controllers/divisionController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public (logged-in users) can view divisions
router.get("/", authMiddleware, getAllDivisions);

// Admin-only: create or delete divisions
router.post("/", authMiddleware, roleMiddleware(["admin"]), addDivision);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteDivision
);

export default router;
