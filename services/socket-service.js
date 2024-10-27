import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { emitWithRetry } from "../promises/emitWithRetry-promise.js"
import { tokenService } from "./token-service.js"

class SocketService {
  constructor(socket, message) {
    this.socket = socket
    this.message = message
  }

  handleConnection(socket) {
    this.socket = socket
    console.log("user connected: ", socket.id)

    socket.on("join__room", async (roomId) => {
      await socket.join(roomId)
      console.log("Joined room: ", roomId)
    })

    socket.on("leave__room", async (roomId) => {
      await socket.leave(roomId)
      console.log("Left room: ", roomId)
    })

    this.socket.on("send__message", (message, userId) => {
      console.log(message)
    })

    socket.on("disconnect", () => console.log("user disconnected: ", socket.id))
  }

  async sendMessage(message, userId) {
    const createdAt = new Date();

    const messageData = await messageModel.create({ message, createdAt, userId });
    const messageDto = new MessageDto(messageData);

    return { ...messageDto }
  }

  async createRoom(name, userId) {
    const createdAt = new Date();
    const createRoom = await roomModel.create({ name, owner: userId, createdAt });
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

    return { ...roomDto }
  }
}


export const socketService = new SocketService()