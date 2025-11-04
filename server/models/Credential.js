// Schema for Credentials
// Represents stored login credentials
import mongoose from "mongoose";

const credentialSchema = new mongoose.Schema(
  {
    ouId: { type: mongoose.Schema.Types.ObjectId, ref: "OU", required: true },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    credentialName: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // consider encrypting
    notes: { type: String }, // store notes about the login
  },
  { timestamps: true }
);

export default mongoose.model("Credential", credentialSchema);
