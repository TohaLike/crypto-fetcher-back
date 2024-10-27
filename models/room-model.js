import { model, Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, required: true },
})

export const roomModel = model("Room", RoomSchema)