// Credential routes
import express from "express";
import {
  getAllCredentials,
  addCredential,
  updateCredential,
} from "../controllers/credentialController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import { divisionAccessMiddleware } from "../middleware/access.js";

const router = express.Router();

// Get all credentials (restricted to divisions user is member of)
router.get("/", authMiddleware, divisionAccessMiddleware, getAllCredentials);

// Add new credential
router.post(
  "/addcred",
  authMiddleware,
  divisionAccessMiddleware,
  addCredential
);

// Update credential restricted to managers and admin
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["manager", "admin"]),
  divisionAccessMiddleware,
  updateCredential
);

export default router;
