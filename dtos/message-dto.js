export default class MessageDto {
  message;
  createdAt;
  id;
  userId;
  roomId;

  constructor(model) {
    this.message = model.message;
    this.createdAt = model.createdAt;
    this.id = model._id;
    this.userId = model.userId;
    this.roomId = model.roomId;
  }
}