import express from "express";
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { routers } from "./router/index.js"
import { errorMiddleware } from "./middlewares/error-middleware.js";
import { Server } from "socket.io";
import { socketService } from "./services/socket-service.js";


dotenv.config()

const PORT = process.env.PORT || 4000;
const app = express();

const server = app.listen(PORT, () => console.log(`Server has been started on port ${PORT}`))
const io = new Server(server, {
  cors: {
    origin: "https://crypto-fetcher-od5e8fcof-antons-projects-5f3e0d01.vercel.app",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: "https://crypto-fetcher-od5e8fcof-antons-projects-5f3e0d01.vercel.app"
}));
app.use("/api", routers)
app.use(errorMiddleware)

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (token) {
    next();
  } else {
    next(new Error("trash"));
  }
});

async function main() {
  try {
    await mongoose.connect(process.env.DB_URL)
    io.on("connection", (socket) => socketService.onConnection(io, socket));
  } catch (e) {
    console.log(e)
  }
}

main()