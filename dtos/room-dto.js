export default class RoomDto {
  name;
  owner;
  id;
  createdAt;
  userdId;

  constructor(model) {
    this.name = model.name
    this.owner = model.owner
    this.id = model._id
    this.createdAt = model.createdAt
    this.userdId = model.usersId
  }
}