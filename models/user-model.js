import { Schema, model } from "mongoose"


const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  date: { type: Date, required: true },
  isActivated: { type: Boolean, default: false },
  activationLink: { type: String }
})

export const userModel = model("User", UserSchema)