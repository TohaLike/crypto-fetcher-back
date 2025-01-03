import * as cookie from 'cookie'
import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { userModel } from "../models/user-model.js"
import { tokenService } from "./token-service.js"
import { lastMessageModel } from '../models/last-message-model.js'
import RoomDataDto from '../dtos/room-data-dto.js'
import mongoose from 'mongoose'

const SESSION_RELOAD_INTERVAL = 30 * 1000;

class SocketService {
  messageStore = []
  postsStore = []

  onConnection(io, socket) {
    console.log("user connected: ", socket.id)

    socket.on("registerToRoom", (userPhone) => {
      console.log("test")
      socket.join(userPhone);
    });

    if (socket.recovered) {
      console.log("recovered!");
      console.log("socket.rooms:", socket.rooms);
      console.log("socket.data:", socket.data);
    } else {
      console.log("new connection");
      socket.join("sample room");
    }

    this.userOnline(io, socket)

    this.joinRooms(io, socket)

    this.joinRoom(io, socket)

    this.typing(io, socket)

    this.stopTyping(io, socket)

    this.sendMessage(io, socket)

    socket.on("leave__room", (roomId) => {
      socket.leave(roomId)
      console.log("Left room: ", roomId)
    })

    socket.on("connect_error", () => {
      console.log("connect_error");
      socket.connect();
    });

    socket.on("reconnect", (attempt) => console.log(attempt, "reconnect"));

    socket.on("reconnect_attempt", (attempt) => console.log(attempt, "reconnect_attempt"));

    socket.on("reconnect_error", (error) => console.log(error, "reconnect_error"));

    socket.on("disconnect", (reason) => {
      console.log("user disconnected: ", socket.id, reason)
    })
  }

  userOnline(io, socket) {
    socket.on("online", async (userId) => {
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      console.log(userId)

      io.to(userId).emit("online", { online: true })
    })
  }

  missedMessages(io, socket) {
    socket.on("get__missed__messages", async () => {
      const missedMessages = this.messageStore || [];
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)

      io.to(userData.id).emit("get__missed__messages", missedMessages);
    });
  }

  typing(io, socket) {
    socket.on("typing", async (roomId) => {
      if (!mongoose.isObjectIdOrHexString(roomId)) throw ApiError.InvalidId()

      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, roomId] } })

      if (!roomData) return

      socket.broadcast.to(roomData.id).emit("typing", { typing: true })
    })
  }

  stopTyping(io, socket) {
    socket.on("stopped__typing", async (roomId) => {
      if (!mongoose.isObjectIdOrHexString(roomId)) throw ApiError.InvalidId()

      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, roomId] } })

      if (!roomData) return

      socket.broadcast.to(roomData.id).emit("stopped__typing", { typing: false })
    })
  }

  joinRooms(io, socket) {
    socket.on("join__rooms", () => {
      const getCookie = socket.handshake.headers.cookie

      if (!getCookie) return

      const token = cookie.parse(getCookie)

      const userData = tokenService.validateRefreshToken(token.refreshToken)

      if (!userData) return;

      socket.join(userData.id)
      console.log("joined", userData.id)
    })
  }


  joinRoom(io, socket) {
    socket.on("join__room", async (roomId) => {
      if (!mongoose.isObjectIdOrHexString(roomId)) return

      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, roomId] } })

      if (!roomData) return;

      socket.join(roomData.id)

      console.log("Joined room: ", roomData.id)
    })
  }

  sendMessage(io, socket) {
    socket.on("send__message", async (message, userId) => {
      if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const updatedAt = new Date();

      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } }).populate({
        path: "usersId", select: "name options", match: {
          _id: {
            $ne: userId
          }
        },
        populate: {
          path: "options",
          select: "image defaultColor"
        }
      })

      if (roomData) {
        await messageModel.create({ sender: userData.name, message, userId: userData.id, roomId: roomData.id });
        const updateMessage = await lastMessageModel.findOneAndUpdate({ roomId: roomData.id, }, { messageText: message,})

        if (!updateMessage) {
          const messageId = await lastMessageModel.create({ roomId: roomData.id, messageText: message, sender: userData.id })
          await roomData.updateOne({ lastMessage: messageId.id })
        }

        io.to(roomData.id).emit("send__message", userData.name, message, userData.id, updatedAt)

        io.to(userId).emit("room__message", userData.name, message, roomData.id, updatedAt, roomData.usersId)

        this.messageStore.push({ userId: userId, message: message })
      }
    })
  }

  async createRoom(refreshToken, userId, lastMessage) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } })

    if (!roomData) {
      const createRoom = await roomModel.create({
        name: userData.name,
        owner: userData.id,
        usersId: [userData.id, userId],
      });

      const messageId = await lastMessageModel.create({ roomId: createRoom.id, messageText: lastMessage, sender: userData.id })

      await createRoom.updateOne({ lastMessage: messageId.id })

      const roomDto = new RoomDto(createRoom);

      return { ...roomDto }
    } else {
      throw ApiError.BadRequest("Вы уже состоите в данной беседе!")
    }
  }

  async getRoom(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)

    const getRoom = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } })

    if (!getRoom) return

    const roomDto = new RoomDataDto(getRoom)

    return roomDto
  }


  async getAllRooms(refreshToken) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const rooms = await roomModel.find({ usersId: userData.id }).populate({
      path: "usersId", select: "name", populate: { path: "options", select: "image defaultColor" }, match: {
        _id: {
          $ne: userData.id
        }
      }
    }).populate("lastMessage", "messageText createdAt updatedAt")


    if (!rooms) return

    const roomDto = rooms.map((e) => new RoomDto(e))

    return roomDto
  }

  async getAllMessages(refreshToken, id, page, limit) {
    if (!mongoose.isObjectIdOrHexString(id)) return
    if (!refreshToken) throw ApiError.UnauthorizedError()
    const userData = tokenService.validateRefreshToken(refreshToken)

    const roomData = await roomModel.findOne({ usersId: { $all: [id, userData.id] } }).populate({
      path: "usersId", select: "name", match: {
        _id: {
          $ne: userData.id
        }
      }
    })

    if (!roomData) return

    const queryPage = parseInt(page) || 1;
    const queryLimit = parseInt(limit) || 40;

    const startIndex = (queryPage - 1) * queryLimit;

    const messages = await messageModel.find({ roomId: roomData.id }).sort({ createdAt: -1 }).skip(startIndex).limit(queryLimit);

    return messages
  }
}


export const socketService = new SocketService()