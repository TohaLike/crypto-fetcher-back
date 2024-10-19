import { Schema, model } from "mongoose"


const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  date: { type: Date, required: true },
  isActivated: { type: Boolean, default: false },
  activationLink: { type: String },
  password: { type: String, required: true },
  createdAt: { type: Date, required: true },
  profileVerification: { type: Boolean }
})

export const userModel = model("User", UserSchema)