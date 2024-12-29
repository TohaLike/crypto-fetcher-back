import { model, Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  usersId: { type: [Schema.Types.ObjectId], default: [], ref: "User" },
  lastMessage: { type: Schema.Types.ObjectId, ref: "LastMessage" }
}, { timestamps: true })

export const roomModel = model("Room", RoomSchema)