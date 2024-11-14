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

    this.joinRoom(io, socket)

    socket.on("leave__room", (roomId) => {
      socket.leave(roomId)
      console.log("Left room: ", roomId)
    })

    this.sendMessage(io, socket)

    socket.on("disconnect", () => console.log("user disconnected: ", socket.id))
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

      const roomData = await roomModel.findOne({ usersId: { $all: [userData.id, userId] } })

      await messageModel.create({ sender: userData.name, message, createdAt, userId: userData.id, roomId: roomData.id });

      await lastMessageModel.findOneAndUpdate({ roomId: roomData.id, }, { messageText: message, createdAt })

      io.to(roomData.id).emit("send__message", userData.name, message)
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

      await lastMessageModel.create({ roomId: createRoom.id, messageText: lastMessage, createdAt, sender: userData.id })

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
    }).populate("_id", "message")

    // const lastMessages = await lastMessageModel.find()
    // .populate({
    //   path: "roomId", // Подтягиваем данные о комнате
    //   select: "name usersId", // Выбираем только нужные поля, например, имя и ID пользователей
    //   populate: { 
    //     path: "usersId", 
    //     select: "name" // Вложенная популяция пользователей для имени
    //   }
    // })
    // .populate({
    //   path: "sender", // Подтягиваем данные о пользователе, отправившем сообщение
    //   select: "name profilePicture" // Включаем нужные поля, например, имя и аватар
    // });

    // console.log(lastMessages)

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

    return { messages, roomData }
  }
}


export const socketService = new SocketService()