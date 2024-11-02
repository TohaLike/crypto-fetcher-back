import { model, Schema } from "mongoose";

const RoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, required: true },
  usersId: { type: [Schema.Types.ObjectId], default: [], ref: "User" }
})

export const roomModel = model("Room", RoomSchema)