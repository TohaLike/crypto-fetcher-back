import { validationResult } from "express-validator";
import { socketService } from "../services/socket-service.js";
import ApiError from "../exceptions/api-error.js";

class SocketController {

  async getAllMessages(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const messages = await socketService.getAllMessages(refreshToken, req.query.res)

      return res.json(messages)
    } catch (e) {
      next(e)
    }
  }

  async createRoom(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { userId } = req.body
      const roomData = await socketService.createRoom(refreshToken, userId)
      return res.json(roomData)
    } catch (e) {
      next(e)
    }
  }

  async getAllRooms(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const rooms = await socketService.getAllRooms(refreshToken)
      return res.json(rooms)
    } catch (e) {
      next(e)
    }
  }
}


export const socketController = new SocketController()