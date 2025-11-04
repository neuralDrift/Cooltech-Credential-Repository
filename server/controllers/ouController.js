// OU Controller
// Handles CRUD operations for Organisational Units (OUs)
import OU from "../models/OU.js";

// Get all OUs
export const getAllOUs = async (req, res) => {
  try {
    const ous = await OU.find().populate(
      "managers",
      "firstname lastname email"
    );
    res.json(ous);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new OU (admin only)
export const addOU = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "OU name is required" });
    const normalizedName = name.trim().toLowerCase();
    const existingOU = await OU.findOne({ normalizedName });
    if (existingOU)
      return res.status(400).json({ message: "OU already exists" });

    const ou = new OU({ name });
    await ou.save();

    res.status(201).json({ message: "OU created successfully", ou });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete OU (admin only)
export const deleteOU = async (req, res) => {
  try {
    const { id } = req.params;

    const ou = await OU.findById(id);
    if (!ou) return res.status(404).json({ message: "OU not found" });

    await ou.remove();
    res.json({ message: "OU deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
