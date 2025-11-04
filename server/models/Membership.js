// Membership model:
// Represents a user's assignment to an OU or Division
// Enforces unique assignments per OU or Division
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ouId: { type: mongoose.Schema.Types.ObjectId, ref: "OU", default: null },
  divisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
    default: null,
  },
  assignedAt: { type: Date, default: Date.now },
});

// Ensure a user cannot be assigned twice to the same division or OU
// This creates a compound unique index on all three fields
membershipSchema.index({ userId: 1, ouId: 1, divisionId: 1 }, { unique: true });

// Additional sparse index for OU-only memberships (when divisionId is null)
membershipSchema.index(
  { userId: 1, ouId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { divisionId: null } }
);

export default mongoose.model("Membership", membershipSchema);
