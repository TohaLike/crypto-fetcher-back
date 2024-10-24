import MessageDto from "../dtos/message-dto.js"
import { messageModel } from "../models/message-model.js"

class SocketService {
  constructor(socket) {
    this.socket = socket
  }

  handleConnection(socket) {
    this.socket = socket
    console.log("user connected: ", socket.id)
    socket.on("disconnect", () => console.log("user disconnected: ", socket.id))
  }


  async sendMessage(message, userId) {
    const createdAt = new Date();
    
    const messageData = await messageModel.create({ message, createdAt, userId });
    const messageDto = new MessageDto(messageData);
    
    console.log(messageDto)

    return { ...messageDto }
  }
}


export const socketService = new SocketService()