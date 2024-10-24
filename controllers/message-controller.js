import { validationResult } from "express-validator";
import { socketService } from "../services/socket-service.js";
import ApiError from "../exceptions/api-error.js";

class MessageController {
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
}


export const messageController = new MessageController()