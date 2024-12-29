export default class SubscriptionsDto {
  id;
  user;
  subscribers;

  constructor(model) {
    this.user = model.user
    this.subscribers = model.subscribers
    this.id = model._id
  }
}
