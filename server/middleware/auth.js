import jwt from "jsonwebtoken";
import User from "../models/User.js";

// JWT login checker
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1]; // Get the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.role && !user.roles) {
      user.roles = user.role;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role based access control
export const roleMiddleware = (allowedRoles) => (req, res, next) => {
  const userRoles = req.user.role; // array of roles

  const hasRole = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
