import { model, Schema } from "mongoose";

const NewsSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  newsFrom: { type: [Schema.Types.ObjectId], ref: "User" },
}, { timestamps: true })


export const newsModel = model("News", NewsSchema)