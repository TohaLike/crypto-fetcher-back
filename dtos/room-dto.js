export default class RoomDto {
  name;
  owner;
  id;
  createdAt;
  usersId;
  lastMessage;

  constructor(model) {
    this.name = model.name
    this.owner = model.owner
    this.id = model._id
    this.createdAt = model.createdAt
    this.usersId = model.usersId
    this.lastMessage = model.lastMessage
  }
}