// Membership routes
import Membership from "../models/Membership.js";
import express from "express";
import {
  addUserToDivision,
  removeUserFromDivision,
  addUserToOU,
  removeUserFromOU,
  getUserMemberships,
  getDivisionMembers,
} from "../controllers/membershipController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

//  DIVISION ASSIGNMENTS
router.post(
  "/division/add",
  authMiddleware,
  roleMiddleware(["admin"]),
  addUserToDivision
);

router.post(
  "/division/remove",
  authMiddleware,
  roleMiddleware(["admin"]),
  removeUserFromDivision
);

//  OU MANAGEMENT
router.post("/ou/add", authMiddleware, roleMiddleware(["admin"]), addUserToOU);

router.post(
  "/ou/remove",
  authMiddleware,
  roleMiddleware(["admin"]),
  removeUserFromOU
);

//  READ ENDPOINTS
router.get("/user/:userId", authMiddleware, getUserMemberships);

router.get(
  "/division/:divisionId",
  authMiddleware,
  roleMiddleware(["manager", "admin"]),
  getDivisionMembers
);

// Add OU member
router.post(
  "/ou/member/add",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { userId, ouId } = req.body;

      const membership = await Membership.findOneAndUpdate(
        { userId, ouId, divisionId: null },
        { $setOnInsert: { userId, ouId, divisionId: null } },
        { upsert: true, new: true }
      );

      res.json({ message: "Added as OU member", membership });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          message: "User is already a member of this OU",
          error: "DUPLICATE_MEMBERSHIP",
        });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

// Remove OU member
router.post(
  "/ou/member/remove",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const { userId, ouId } = req.body;
    await Membership.deleteOne({ userId, ouId, divisionId: null });
    res.json({ message: "Removed from OU member" });
  }
);

export default router;
