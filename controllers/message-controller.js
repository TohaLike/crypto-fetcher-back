import { messageService } from "../services/rabbitmq-service.js"

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body
      // const data = await messageService.sendMessage("fanout", "rKey", message)

      return res.json(message)
    } catch (e) {
      console.log("E", e)
    }
  }
}


export const messageController = new MessageController()