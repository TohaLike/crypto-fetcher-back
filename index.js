import express from "express";
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { routers } from "./router/index.js"
import { errorMiddleware } from "./middlewares/error-middleware.js";
import { Server } from "socket.io";
import { socketService } from "./services/socket-service.js";
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';


dotenv.config()

const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  methods: ['GET', 'POST'],
  origin: process.env.CLIENT_URL,
}));
app.use("/api", routers)
app.use(errorMiddleware)


const server = app.listen(PORT, () => console.log(`Server has been started on port ${PORT}`))

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

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
    io.on("connection", (socket) => {
      console.log(socket.connected)
      socketService.onConnection(io, socket)
    });
  } catch (e) {
    console.log(e)
  }
}

main()