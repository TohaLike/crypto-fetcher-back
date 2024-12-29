import { Schema, model } from "mongoose";

const PostSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  images: { type: [String] },
  text: { type: String },
  loaded: { type: Boolean }
}, { timestamps: true })

export const postModel = model("Posts", PostSchema)