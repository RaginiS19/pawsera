import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ["Admin", "Vet", "Pet Owner"] },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", userSchema);

export default User;
