import { Schema } from "mongoose";

const RoomMembersSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  userId: { type: Schema.Types.ObjectId, ref: "User" }
})

export const roomMembersModel = model("RoomMembers", RoomMembersSchema)