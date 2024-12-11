export default class PostDto {
  owner;
  id;
  createdAt;
  images;
  text;

  constructor(model) {
    this.owner = model.owner
    this.id = model._id
    this.createdAt = model.createdAt
    this.images = model.images
    this.text = model.text
  }
}
