import { validationResult } from "express-validator";
import { socketService } from "../services/socket-service.js";
import ApiError from "../exceptions/api-error.js";

class SocketController {

  async getAllMessages(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { page, limit } = req.query

      const messages = await socketService.getAllMessages(refreshToken, req.query.res, page, limit)

      return res.json(messages)
    } catch (e) {
      next(e)
    }
  }

  async createRoom(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Ошибка при валидации", errors.array()))
      }

      const { refreshToken } = req.cookies
      const { userId, lastMessage } = req.body

      const roomData = await socketService.createRoom(refreshToken, userId, lastMessage)
      return res.json(roomData)
    } catch (e) {
      next(e)
    }
  }
  async getRoom(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const rooms = await socketService.getRoom(refreshToken, req.query.res)
      return res.json(rooms)
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