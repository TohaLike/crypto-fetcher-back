import { Schema, model } from "mongoose";

const PostSchema = new Schema({
  images: { type: [Schema.Types.ObjectId], ref: "User" },
  text: { type: String, min: 1}
})

export const postModel = model("Posts", PostSchema)