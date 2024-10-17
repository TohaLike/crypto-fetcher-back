export default class UserDto {
  name;
  email;
  date;
  id;
  isActivated;

  constructor(model) {
    this.name = model.name;
    this.email = model.email;
    this.date = model.date;
    this.id = model._id;
    this.isActivated = model.isActivated;
  }
}