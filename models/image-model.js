import { Schema, model } from "mongoose";

const ImageSchema = new Schema({
  fileName: { type: [String] }
}, { timestamps: true })


export const imageModel = model("Image", ImageSchema)