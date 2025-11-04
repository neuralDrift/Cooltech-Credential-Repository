// User Controller
// Handles CRUD operations for users
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Membership from "../models/Membership.js";
import OU from "../models/OU.js";
import Division from "../models/Division.js";

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const user = new User({
      firstname,
      lastname,
      email,
      password,
      role: ["user"], // always normal user on creation
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login with existing user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare entered password with hashed password
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const usersWithMemberships = await Promise.all(
      users.map(async (user) => {
        //  POPULATE managedOus safely
        const managedOus =
          Array.isArray(user.managedOus) && user.managedOus.length > 0
            ? await OU.find({ _id: { $in: user.managedOus } }).select("name")
            : [];

        //  POPULATE memberships
        const memberships = await Membership.find({ userId: user._id })
          .populate("ouId", "name")
          .populate({
            path: "divisionId",
            select: "name",
            populate: { path: "ouId", select: "name" },
          });

        return {
          ...user.toObject(),
          managedOus,
          memberships,
        };
      })
    );

    res.json({ users: usersWithMemberships });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update user role (Admin Only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!["user", "manager", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    user.role = [role]; // role is array
    await user.save();

    res.json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
