import { model, Schema } from "mongoose";

const ProfileOptionsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  image: { type: [Object] },
  defaultColor: { type: String }
}, { timestamps: true })

export const profileOptionsModel = model("Profileoptions", ProfileOptionsSchema)