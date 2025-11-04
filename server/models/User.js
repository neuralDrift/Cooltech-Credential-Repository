// User model:
// Represents a system user with login credentials and role-based access
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define schema for Users table
const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true }, // hashed password
    role: {
      type: [String],
      default: ["user"],
      enum: ["user", "manager", "admin"],
    },

    // Management / admin privilege memberships
    // array of organisational units user manages
    managedOus: [{ type: mongoose.Schema.Types.ObjectId, ref: "OU" }],
    // array of divisions user manages
    managedDivisions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Division" },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare hashed password to entered one
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// export model
export default mongoose.model("User", userSchema);
