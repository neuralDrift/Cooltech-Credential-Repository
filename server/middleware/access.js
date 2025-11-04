// access.js
// Access middleware:
// - Loads user memberships from DB and exposes division/OU IDs on request
// - Grants admin unconditional access, checks manager has managed Divs/OUs
// - Ensures regular users have at least one division or OU access
import Membership from "../models/Membership.js";

export const divisionAccessMiddleware = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      console.warn("divisionAccessMiddleware → No user on request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Log basic user info for debugging
    console.log("divisionAccessMiddleware → user:", {
      id: user.id,
      roles: user.roles,
      managedDivisions: user.managedDivisions,
      managedOus: user.managedOus,
      hasMemberships: Array.isArray(user.memberships),
    });

    // Load memberships from DB (user schema doesn't embed memberships)
    const memberships = await Membership.find({ userId: user._id }).select(
      "divisionId ouId"
    );

    // Extract division IDs
    const userDivisionIds = memberships
      .filter((m) => m && m.divisionId)
      .map((m) => m.divisionId.toString());

    // Extract OU IDs from memberships
    const userOuIds = memberships
      .filter((m) => m && m.ouId)
      .map((m) => m.ouId.toString());

    // Store for later middleware/controllers
    req.userDivisionIds = userDivisionIds;
    req.userOuIds = userOuIds;

    // Admins always proceed
    if (user.roles?.includes("admin")) {
      return next();
    }

    // Managers can proceed if they manage any divisions or OUs
    if (user.roles?.includes("manager")) {
      const hasManagedDivs = Array.isArray(user.managedDivisions) && user.managedDivisions.length > 0;
      const hasManagedOus = Array.isArray(user.managedOus) && user.managedOus.length > 0;
      if (hasManagedDivs || hasManagedOus) {
        return next();
      } else {
        console.warn("divisionAccessMiddleware → Manager has no managed divisions or OUs");
        return res.status(403).json({
          message: "No managed divisions or OUs linked to your account",
        });
      }
    }

    // Regular user: must have at least one division or OU
    if (userDivisionIds.length === 0 && userOuIds.length === 0) {
      console.warn("divisionAccessMiddleware → No division access found");
      return res.status(403).json({
        message: "You do not have access to any divisions or OUs",
      });
    }

    next();
  } catch (err) {
    console.error("divisionAccessMiddleware error:", err);
    res.status(500).json({ message: err.message });
  }
};
