 export default class RoomDataDto {
  createdAt;

  constructor(model) {
    this.createdAt = model.createdAt;
  }
}