// Organisational Unit model:
// Enforces case-insensitive uniqueness via normalizedName (lowercased, trimmed)
// Stores manager references and timestamps
import mongoose from "mongoose";

const ouSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // normalized lowercased name to enforce case-insensitive uniqueness
    normalizedName: { type: String, required: true, unique: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who manage this OU
  },
  { timestamps: true }
);

// Ensure normalizedName is set before validation/save
ouSchema.pre("validate", function (next) {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
  next();
});

export default mongoose.model("OU", ouSchema);
