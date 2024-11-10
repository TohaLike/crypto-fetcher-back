export default class RoomDto {
  name;
  owner;
  id;
  createdAt;
  usersId;

  constructor(model) {
    this.name = model.name
    this.owner = model.owner
    this.id = model._id
    this.createdAt = model.createdAt
    this.usersId = model.usersId
  }
}