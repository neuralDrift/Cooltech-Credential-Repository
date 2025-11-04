// Credential Controller
// Handles CRUD operations for credentials
import Credential from "../models/Credential.js";

// Helper: Populate division + OU
const populateCredential = (credential) => {
  return credential.populate({
    path: "divisionId",
    select: "name",
    populate: {
      path: "ouId",
      select: "name",
    },
  });
};

// Add new credential
export const addCredential = async (req, res) => {
  try {
    const { ouId, divisionId, credentialName, username, password, notes } =
      req.body;

    if (!ouId || !divisionId || !credentialName || !username || !password) {
      return res
        .status(400)
        .json({ message: "All fields except notes are required" });
    }

    const credential = new Credential({
      ouId,
      divisionId,
      credentialName,
      username,
      password,
      notes,
    });

    await credential.save();
    await populateCredential(credential);

    res
      .status(201)
      .json({ message: "Credential added successfully", credential });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all credentials
export const getAllCredentials = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // If admin → return all
    if (user.roles?.includes("admin")) {
      const credentials = await Credential.find()
        .populate({
          path: "divisionId",
          select: "name ouId",
          populate: { path: "ouId", select: "name" },
        })
        .select("+password");
      return res.json({ credentials });
    }

    // If manager → filter by their managed divisions/OUs AND their memberships
    if (user.roles?.includes("manager")) {
      const managedDivIds = (user.managedDivisions || []).map((id) =>
        id.toString()
      );
      const managedOuIds = (user.managedOus || []).map((id) => id.toString());

      // Also include divisions/OUs they are members of
      const userDivisionIds = req.userDivisionIds || [];
      const userOuIds = req.userOuIds || [];

      // Combine managed and member access
      const allDivisionIds = [
        ...new Set([...managedDivIds, ...userDivisionIds]),
      ];
      const allOuIds = [...new Set([...managedOuIds, ...userOuIds])];

      const credentials = await Credential.find({
        $or: [
          { divisionId: { $in: allDivisionIds } },
          { ouId: { $in: allOuIds } },
        ],
      })
        .populate({
          path: "divisionId",
          select: "name ouId",
          populate: { path: "ouId", select: "name" },
        })
        .select("+password");

      return res.json({ credentials });
    }

    // For normal users → use division and OU memberships from middleware
    const userDivisionIds = req.userDivisionIds || [];
    const userOuIds = req.userOuIds || [];

    const credentials = await Credential.find({
      $or: [
        { divisionId: { $in: userDivisionIds } },
        { ouId: { $in: userOuIds } },
      ],
    })
      .populate({
        path: "divisionId",
        select: "name ouId",
        populate: { path: "ouId", select: "name" },
      })
      .select("+password");

    res.json({ credentials });
  } catch (err) {
    console.error("getAllCredentials error:", err);
    res.status(500).json({ message: "Server error retrieving credentials" });
  }
};

// Update existing credential
export const updateCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const { ouId, divisionId, credentialName, username, password, notes } =
      req.body;

    const updateData = { ouId, divisionId, credentialName, username, notes };
    if (password) updateData.password = password;

    const credential = await Credential.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "divisionId",
      select: "name ouId",
      populate: { path: "ouId", select: "name" },
    });

    if (!credential)
      return res.status(404).json({ message: "Credential not found" });

    res.json({ credential });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};
