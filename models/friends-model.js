import { model, Schema } from "mongoose";

const FriendsSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  friends: { type: [Schema.Types.ObjectId], ref: "User" }
}, { timestamps: true })


export const friendsModel = model("Friends", FriendsSchema)