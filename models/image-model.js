import { Schema, model } from "mongoose";

const ImageSchema = new Schema({
  fileName: { type: [Array] }
}, { timestamps: true })


export const imageModel = model("Image", ImageSchema)