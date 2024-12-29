export default class FollowingDto {
  id;
  owner;
  newsFrom;

  constructor(model) {
    this.id = model._id;
    this.owner = model.owner;
    this.newsFrom = model.newsFrom;
  }
}
