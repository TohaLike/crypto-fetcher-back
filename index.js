import express from "express";
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import http from "http"
import { routers } from "./router/index.js"
import { errorMiddleware } from "./middlewares/error-middleware.js";
import { Server } from "socket.io";
import { socketService } from "./services/socket-service.js";
import multer from "multer";

dotenv.config()

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);

const storageConfig = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "./images")
  },
  filename: (req, file, cb) => {
    let extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
    cb(null, crypto.randomUUID() + extension);
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg") {
    cb(null, true);
  }
  else {
    cb(null, false);
    const err = new Error('Only .png, .jpg and .jpeg format allowed!')
    err.name = 'ExtensionError'
    return cb(err);
  }
}

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  credentials: true,
  methods: ['GET', 'POST'],
  origin: process.env.CLIENT_URL,
}));

app.use(multer({
  storage: storageConfig,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: fileFilter
}).any("file", 5));

app.use("/api", routers) 
app.use(errorMiddleware)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
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
    await mongoose.connect(process.env.DB_URL);

    server.listen(PORT, () => console.log(`Server has been started on port ${PORT}`))

    io.on("connection", (socket) => socketService.onConnection(io, socket));
  } catch (e) {
    console.log(e)
  }
}

main()