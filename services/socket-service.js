import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { userModel } from "../models/user-model.js"
import { tokenService } from "./token-service.js"

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
      socket.join(roomId)
      console.log("Joined room: ", roomId)

      const roomData = await roomModel.findOne({ roomId: roomId })

      socket.emit("room__id", roomData?.id)
    })
  }

  sendMessage(io, socket) {
    socket.on("send__message", async (userName, message, userId, roomId, roomKey,) => {
      const createdAt = new Date();
      await messageModel.create({ sender: userName, message, createdAt, userId, roomId });

      io.to(roomKey).emit("send__message", userName, message)
    })
  }

  async createRoom(name, ownerId, userId) {
    const roomId = [userId, ownerId].join('-');

    console.log(roomId)

    const createdAt = new Date();

    const createRoom = await roomModel.create({
      roomId,
      name,
      owner: ownerId,
      createdAt,
      usersId: [ownerId, userId]
    });

    const roomDto = new RoomDto(createRoom);

    return { ...roomDto }
  }

  async getAllRooms(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateRefreshToken(refreshToken)
    const rooms = await roomModel.find({ usersId: userData.id });
    const roomDto = rooms.map((e) => new RoomDto(e))

    return roomDto
  }

  async getAllMessages(refreshToken, roomId) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const roomData = await roomModel.findOne({ roomId })
    const findUser = roomData?.usersId?.some((e) => e.toString() === userData.id)

    if (!findUser) {
      throw ApiError.BadRequest("no")
    }

    const messages = await messageModel.find({ roomId: roomData.id});

    return messages
  }
}


export const socketService = new SocketService()