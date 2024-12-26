import { Schema, model } from "mongoose"

const SubscribersSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  subscribers: { type: [Schema.Types.ObjectId], ref: "User" }
})


export const subscribersModel = model("Subscribers", SubscribersSchema)