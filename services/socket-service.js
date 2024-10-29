import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { emitWithRetry } from "../promises/emitWithRetry-promise.js"
import { tokenService } from "./token-service.js"

class SocketService {
  onConnection(io, socket) {
    console.log("user connected: ", socket.id)

    console.log(socket.handshake)

    this.joinRoom(io, socket)

    socket.on("leave__room", (roomId) => {
      socket.leave(roomId)
      console.log("Left room: ", roomId)
    })

    this.sendMessage(io, socket)

    socket.on("disconnect", () => console.log("user disconnected: ", socket.id))
  }


  joinRoom(io, socket) {
    socket.on("join__room", (roomId) => {
      socket.join(roomId)
      console.log("Joined room: ", roomId)
    })
  }


  sendMessage(io, socket) {
    socket.on("send__message", async (userName, message, userId) => {
      const createdAt = new Date();
      await messageModel.create({ message, createdAt, userId });

      io.emit("send__message", userName, message)
    })
  }

  async createRoom(name, ownerId, userId) {
    const createdAt = new Date();
    const createRoom = await roomModel.create({ name, owner: ownerId, createdAt, usersId: [ownerId, userId] });
    const roomDto = new RoomDto(createRoom);

    return { ...roomDto }
  }

  async getAllRooms(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateRefreshToken(refreshToken)
    const rooms = await roomModel.find({ owner: userData.id });
    const roomDto = rooms.map((e) => new RoomDto(e))

    return roomDto
  }

  async getMessages() {
    const messages = await messageModel.find();
    return messages
  }
}


export const socketService = new SocketService()