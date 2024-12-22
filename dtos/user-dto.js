export default class UserDto {
  name;
  email;
  date;
  id;
  isActivated;
  createdAt;
  profileVerification;
  options;

  constructor(model) {
    this.name = model.name;
    this.email = model.email;
    this.date = model.date;
    this.id = model._id;
    this.isActivated = model.isActivated;
    this.createdAt = model.createdAt;
    this.profileVerification = model.profileVerification;
    this.options = model.options
  }
}