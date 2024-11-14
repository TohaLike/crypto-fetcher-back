import { Schema, model } from "mongoose";

const LastMessageSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  messageId: { type: Schema.Types.ObjectId, ref: "Message" },
  messageText: { type: String, required: true  },
  sender: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, required: true },
})

export const lastMessageModel = model("LastMessage", LastMessageSchema)

