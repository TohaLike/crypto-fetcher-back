import { Schema, model } from "mongoose";

const PostSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  images: { type: Array },
  text: { type: String },
}, { timestamps: true })

export const postModel = model("Posts", PostSchema)