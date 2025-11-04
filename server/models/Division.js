// Division model:
// Enforces case-insensitive uniqueness per OU via normalizedName + ouId index
// Stores manager references and timestamps
import mongoose from "mongoose";

const divisionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // normalized lowercased name to enforce case-insensitive uniqueness per OU
    normalizedName: { type: String, required: true },
    ouId: { type: mongoose.Schema.Types.ObjectId, ref: "OU", default: null },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Compound index: division normalizedName unique within each OU (case-insensitive)
divisionSchema.index({ ouId: 1, normalizedName: 1 }, { unique: true });

divisionSchema.pre("validate", function (next) {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
  next();
});

export default mongoose.model("Division", divisionSchema);
