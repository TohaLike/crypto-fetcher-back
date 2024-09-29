import express from "express";
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { routers } from "./router/index.js"

dotenv.config()

const PORT = process.env.PORT || 4000
const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/api", routers)


async function main() {
  try {
    await mongoose.connect(process.env.DB_URL)
    app.listen(PORT, () => console.log(`Server has been started on port ${PORT}`))
  } catch (e) {
    console.log(e)
  }
}

main()