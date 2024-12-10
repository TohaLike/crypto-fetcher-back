import mongoose, { Schema } from "mongoose";

const ImageSchema = new Schema({
  imageUrl: { type: mongoose.Types.ObjectId }

})