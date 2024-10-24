import { model, Schema } from "mongoose";

const MessageSchema = new Schema({
  message: { type: String, required: true },
  createdAt: { type: Date, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
})

export const messageModel = model("Message", MessageSchema)