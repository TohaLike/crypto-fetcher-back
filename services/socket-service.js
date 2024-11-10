import * as cookie from 'cookie'
import MessageDto from "../dtos/message-dto.js"
import RoomDto from "../dtos/room-dto.js"
import ApiError from "../exceptions/api-error.js"
import { messageModel } from "../models/message-model.js"
import { roomModel } from "../models/room-model.js"
import { userModel } from "../models/user-model.js"
import { tokenService } from "./token-service.js"
import mongoose, { mongo } from 'mongoose'

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
    })
  }

  sendMessage(io, socket) {
    socket.on("send__message", async (message, roomId) => {
      const token = cookie.parse(socket.handshake.headers.cookie)
      const userData = tokenService.validateRefreshToken(token.refreshToken)
      const userId = userData.id
      const sender = userData.name

      const createdAt = new Date();

      await messageModel.create({ sender, message, createdAt, userId, roomId });

      io.to(roomId).emit("send__message", sender, message)
    })
  }

  async createRoom(refreshToken, userId) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const createdAt = new Date();

    const createRoom = await roomModel.create({
      name: userData.name,
      owner: userData.id,
      createdAt,
      usersId: [userData.id, userId]
    });

    const roomDto = new RoomDto(createRoom);

    return { ...roomDto }
  }

  async getAllRooms(refreshToken) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    // const rooms = await roomModel.find({ usersId: userData.id });
    // const roomDto = rooms.map((e) => new RoomDto(e))
    // const roomsId = rooms.map((e) => e._id)

    const rooms = await roomModel.aggregate([
      { $match: { usersId: new mongoose.Types.ObjectId(userData.id) } },
      {
        $project: {
          roomId: "$_id",
          otherParticipantId: {
            $arrayElemAt: [
              { $filter: { input: "$usersId", cond: { $ne: ["$$this", userData.id] } } },
              0
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "otherParticipantId",
          foreignField: "_id",
          pipeline: [{
            $project: {
              name: 1,
            }
          }],
          as: "companion"
        }
      },
      { $unwind: { path: "$companion" } },
      {
        $lookup:
        {
          from: "messages",
          let: { roomId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$roomId", "$$roomId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                message: 1,
                createdAt: 1
              }
            }
          ],
          as: "lastMessage"
        },
      },
      {
        $unwind: { path: "$lastMessage" }
      },
      {
        $project: {
          roomId: "$_id",
          companion: 1,
          lastMessage: 1,
        }
      }
    ])

    return rooms
  }

  async getAllMessages(refreshToken, id) {
    if (!refreshToken) throw ApiError.UnauthorizedError()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const roomData = await roomModel.findOne({ _id: id })
    const findUser = roomData?.usersId?.some((e) => e.toString() === userData.id)

    if (!findUser) throw ApiError.BadRequest("В не состоите в этой беседе!")

    const messages = await messageModel.find({ roomId: roomData.id });

    return messages
  }
}


export const socketService = new SocketService()