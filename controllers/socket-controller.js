import { validationResult } from "express-validator";
import { socketService } from "../services/socket-service.js";
import ApiError from "../exceptions/api-error.js";

class SocketController {
  async sendMessage(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Ошибка при валидации", errors.array()))
      }

      const { message, userId } = req.body;

      const messageData = await socketService.sendMessage(message, userId);

      return res.json(messageData)
    } catch (e) {
      next(e)
    }
  }

  async createRoom(req, res, next) {
    try {
      const { name, userId } = req.body
      const roomData = await socketService.createRoom(name, userId)
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