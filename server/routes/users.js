// User routes
import express from "express";
import {
  updateUserRole,
  registerUser,
  loginUser,
  getAllUsers,
} from "../controllers/userController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

// public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only operations
router.put("/role", authMiddleware, roleMiddleware(["admin"]), updateUserRole);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  getAllUsers
);

export default router;
