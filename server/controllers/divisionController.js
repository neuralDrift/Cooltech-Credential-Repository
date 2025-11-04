// Division Controller
// Handles CRUD operations for divisions
import Division from "../models/Division.js";
import OU from "../models/OU.js";

// Get all divisions
export const getAllDivisions = async (req, res) => {
  try {
    // Find all divisions, populate the OU name
    const divisions = await Division.find()
      .populate("ouId", "name") // include OU name
      .select("_id name ouId");

    res.json({ divisions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new division (admin only)
export const addDivision = async (req, res) => {
  try {
    const { name, ouId } = req.body;
    if (!name || !ouId)
      return res.status(400).json({ message: "Name and OU ID are required" });

    // Validate OU exists
    const ou = await OU.findById(ouId);
    if (!ou) return res.status(400).json({ message: "Invalid OU ID" });

    // Normalize name to lowercase for uniqueness check
    const normalizedName = name.trim().toLowerCase();
    const existing = await Division.findOne({ ouId, normalizedName });
    if (existing)
      return res.status(400).json({ message: "Division already exists" });

    // Create and save new division
    const division = new Division({ name, ouId });
    await division.save();

    res
      .status(201)
      .json({ message: "Division created successfully", division });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete division (admin only)
export const deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    // Check division exists
    const division = await Division.findById(id);
    if (!division)
      return res.status(404).json({ message: "Division not found" });

    // Remove the division
    await division.remove();
    res.json({ message: "Division deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
