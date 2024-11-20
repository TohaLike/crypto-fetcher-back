import * as cookie from 'cookie'
import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { userModel } from "../models/user-model.js"
import { tokenService } from "./token-service.js"
import { lastMessageModel } from '../models/last-message-model.js'

class SocketService {
  onConnection(io, socket) {
    console.log("user connected: ", socket.id)

    this.joinRooms(io, socket)

    this.joinRoom(io, socket)

    this.typing(io, socket)

    this.stopTyping(io, socket)

    socket.on("leave__room", (roomId) => {
      socket.leave(roomId)
      console.log("Left room: ", roomId)
    })

    this.sendMessage(io, socket)

    socket.on("disconnect", () => console.log("user disconnected: ", socket.id))
  }

  typing(io, socket) {
    socket.on("typing", async (roomId) => {
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, roomId] } })

      if (!roomData) return

      socket.broadcast.to(roomData.id).emit("typing", true)
    })
  }

  stopTyping(io, socket) {
    socket.on("stopped__typing", async (roomId) => {
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, roomId] } })

      if (!roomData) return
      
      console.log("Не пишет")

      socket.broadcast.to(roomData.id).emit("stopped__typing", false)
    })
  }

  joinRooms(io, socket) {
    socket.on("join__rooms", () => {
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)

      if (!userData) return;

      socket.join(userData.id)
      console.log("joined", userData.id)
    })
  }


  joinRoom(io, socket) {
    socket.on("join__room", async (roomId) => {
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
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const createdAt = new Date();

      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } }).populate({
        path: "usersId", select: "name", match: {
          _id: {
            $ne: userId
          }
        }
      })

      await messageModel.create({ sender: userData.name, message, createdAt, userId: userData.id, roomId: roomData.id });

      const updateMessage = await lastMessageModel.findOneAndUpdate({ roomId: roomData.id, }, { messageText: message, createdAt })

      if (!updateMessage) {
        const messageId = await lastMessageModel.create({ roomId: roomData.id, messageText: message, createdAt, sender: userData.id })
        await roomData.updateOne({ lastMessage: messageId.id })
      }

      io.to(roomData.id).emit("send__message", userData.name, message, userData.id, createdAt)

      io.to(userId).emit("room__message", userData.name, message, roomData.id, createdAt, roomData.usersId)
    })
  }

  async createRoom(refreshToken, userId, lastMessage) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const createdAt = new Date();
    const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } })

    if (!roomData) {
      const createRoom = await roomModel.create({
        name: userData.name,
        owner: userData.id,
        createdAt,
        usersId: [userData.id, userId],
      });

      const messageId = await lastMessageModel.create({ roomId: createRoom.id, messageText: lastMessage, createdAt, sender: userData.id })

      await createRoom.updateOne({ lastMessage: messageId.id })

      const roomDto = new RoomDto(createRoom);

      return { ...roomDto }
    }
  }

  async getAllRooms(refreshToken) {
    if (!refreshToken) throw ApiError.UnauthorizedError()
    const userData = tokenService.validateRefreshToken(refreshToken)

    const rooms = await roomModel.find({ usersId: userData.id }).populate({
      path: "usersId", select: "name", match: {
        _id: {
          $ne: userData.id
        }
      }
    }).populate("lastMessage", "messageText createdAt")

    const roomDto = rooms.map((e) => new RoomDto(e))

    return roomDto
  }

  async getAllMessages(refreshToken, id) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const roomData = await roomModel.findOne({ usersId: { $all: [id, userData.id] } }).populate({
      path: "usersId", select: "name", match: {
        _id: {
          $ne: userData.id
        }
      }
    })

    if (!roomData) throw ApiError.BadRequest("В не состоите в этой беседе!")

    const messages = await messageModel.find({ roomId: roomData.id });

    return messages
  }
}


export const socketService = new SocketService()