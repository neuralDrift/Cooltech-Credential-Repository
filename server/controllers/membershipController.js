// membershipController.js
// Membership management for Divisions and OUs:
// - Add/remove division memberships
// - Add/remove OU manager and OU member-only memberships
// - Query helpers for division members and user memberships
// - Uses upsert patterns to avoid duplicates and handles duplicate key errors
import User from "../models/User.js";
import Division from "../models/Division.js";
import OU from "../models/OU.js";
import Membership from "../models/Membership.js";

// DIVISION MEMBERSHIP

// Add user to a division
export const addUserToDivision = async (req, res) => {
  try {
    const { userId, divisionId } = req.body;
    if (!userId || !divisionId)
      return res
        .status(400)
        .json({ message: "userId and divisionId required" });

    const [user, division] = await Promise.all([
      User.findById(userId),
      Division.findById(divisionId).populate("ouId", "name"),
    ]);
    if (!user || !division)
      return res.status(404).json({ message: "User or Division not found" });

    // Upsert membership to prevent duplicates - must match compound index
    const membership = await Membership.findOneAndUpdate(
      { userId, divisionId, ouId: division.ouId._id },
      { userId, divisionId, ouId: division.ouId._id },
      { upsert: true, new: true }
    ).populate([
      { path: "userId", select: "firstname lastname email" },
      {
        path: "divisionId",
        select: "name",
        populate: { path: "ouId", select: "name" },
      },
    ]);

    res.status(201).json({ message: "User added to division", membership });
  } catch (err) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        message: "User is already assigned to this division",
        error: "DUPLICATE_MEMBERSHIP",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Remove user from a division
export const removeUserFromDivision = async (req, res) => {
  try {
    const { userId, divisionId } = req.body;
    const result = await Membership.deleteOne({ userId, divisionId });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Assignment not found" });

    res.json({ message: "User removed from division" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// OU MANAGER MEMBERSHIP

// Add user as OU manager (also creates OU member if not exists)
export const addUserToOU = async (req, res) => {
  try {
    const { userId, ouId } = req.body;

    const [user, ou] = await Promise.all([
      User.findById(userId),
      OU.findById(ouId),
    ]);
    if (!user || !ou)
      return res.status(404).json({ message: "User or OU not found" });

    // Add as manager if not already
    if (!user.managedOus.includes(ouId)) {
      user.managedOus.push(ouId);
      await user.save();
    }

    // Add as member only if not exists
    await Membership.updateOne(
      { userId, ouId, divisionId: null },
      { $setOnInsert: { userId, ouId, divisionId: null } },
      { upsert: true }
    );

    res.json({ message: "User added as OU manager", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove user as OU manager
export const removeUserFromOU = async (req, res) => {
  try {
    const { userId, ouId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.managedOus = user.managedOus.filter((id) => id.toString() !== ouId);
    await user.save();

    res.json({ message: "User removed as OU manager", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// OU MEMBER ONLY

// Add user as OU member
export const addUserToOUMember = async (req, res) => {
  try {
    const { userId, ouId } = req.body;
    if (!userId || !ouId)
      return res.status(400).json({ message: "userId and ouId required" });

    const [user, ou] = await Promise.all([
      User.findById(userId),
      OU.findById(ouId),
    ]);
    if (!user || !ou)
      return res.status(404).json({ message: "User or OU not found" });

    // Upsert membership with divisionId: null to avoid duplicates
    const membership = await Membership.findOneAndUpdate(
      { userId, ouId, divisionId: null },
      { $setOnInsert: { userId, ouId, divisionId: null } },
      { upsert: true, new: true }
    ).populate([
      { path: "userId", select: "firstname lastname email" },
      { path: "ouId", select: "name" },
    ]);

    res.json({ message: "User added as OU member", membership });
  } catch (err) {
    console.error(err);
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        message: "User is already a member of this OU",
        error: "DUPLICATE_MEMBERSHIP",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Remove user as OU member
export const removeUserFromOUMember = async (req, res) => {
  try {
    const { userId, ouId } = req.body;
    const result = await Membership.deleteOne({
      userId,
      ouId,
      divisionId: null,
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Assignment not found" });

    res.json({ message: "User removed from OU member" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// QUERY MEMBERSHIPS

// Get all users in a division
export const getDivisionMembers = async (req, res) => {
  try {
    const { divisionId } = req.params;
    const members = await Membership.find({ divisionId })
      .populate("userId", "firstname lastname email role")
      .populate("ouId", "name");
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all memberships of a user
export const getUserMemberships = async (req, res) => {
  try {
    const { userId } = req.params;
    const memberships = await Membership.find({ userId }).populate([
      { path: "userId", select: "firstname lastname email" },
      {
        path: "divisionId",
        select: "name",
        populate: { path: "ouId", select: "name" },
      },
      { path: "ouId", select: "name" },
    ]);
    res.json({ memberships });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
