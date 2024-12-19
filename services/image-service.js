import { tokenService } from "./token-service.js"
import ApiError from "../exceptions/api-error.js"
import { postModel } from "../models/post-model.js"
import PostDto from "../dtos/post-dto.js"
import { imageModel } from "../models/image-model.js"
import { newsModel } from "../models/news-model.js"

class ImageService {
  loadedPosts = []

  async uploadImage(refreshToken, text, files) {
    // if (!files) throw ApiError.BadRequest("Ошибка загрузки файла")

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    // const news = await newsModel.find({ owner: userData.id })

    // if (!news) {
    //   const news 

    // }

    await imageModel.create({ fileName: [...files] })

    const data = await postModel.create({ owner: userData.id, text: text, images: [...files] })

    this.loadedPosts.push(data)

    return data
  }



  async getSubscribePosts(refreshToken, page, limit) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const token = await tokenService.findToken(refreshToken)

    if (!userData || !token) throw ApiError.UnauthorizedError()

    const queryPage = parseInt(page) || 1;
    const queryLimit = parseInt(limit) || 40;

    const startIndex = (queryPage - 1) * queryLimit;

    const addNews = await newsModel.findOne({ owner: userData.id })

    const news = addNews ? addNews.newsFrom.concat(userData.id) : userData.id

    const posts = await postModel.find({ owner: { $in: news } }).sort({ createdAt: -1 }).skip(startIndex).limit(queryLimit).populate({ path: "owner", select: "name _id" })

    if (!posts) return

    const postsDto = posts.map((e) => new PostDto(e))

    return postsDto
  }


  async loadMore(refreshToken, createdAt) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const token = await tokenService.findToken(refreshToken)

    if (!userData || !token) throw ApiError.UnauthorizedError()

    const addNews = await newsModel.findOne({ owner: userData.id })

    const postsCount = await postModel.countDocuments({ owner: { $in: addNews.newsFrom }, createdAt: { $gt: createdAt } })

    if (postsCount <= 0) return

    return postsCount
  }
}



export const imageService = new ImageService()