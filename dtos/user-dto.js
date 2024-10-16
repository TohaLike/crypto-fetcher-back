export default class UserDto {
  email;
  date;
  id;
  isActivated;

  constructor(model) {
    this.email = model.email;
    this.date = model.date;
    this.id = model._id;
    this.isActivated = model.isActivated;
  }
}