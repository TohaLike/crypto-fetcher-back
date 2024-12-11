import { tokenService } from "./token-service.js"
import ApiError from "../exceptions/api-error.js"
import { postModel } from "../models/post-model.js"
import PostDto from "../dtos/post-dto.js"
import { imageModel } from "../models/image-model.js"

class ImageService {
  async uploadImage(refreshToken, text, files) {
    // if (!files) throw ApiError.BadRequest("Ошибка загрузки файла")

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    await imageModel.create({ fileName: [...files] })

    const data = await postModel.create({ owner: userData.id, text: text, images: [...files] })

    return data
  }



  async getPosts(refreshToken, page, limit) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const token = await tokenService.findToken(refreshToken)

    if (!userData || !token) throw ApiError.UnauthorizedError()

    const queryPage = parseInt(page) || 1;
    const queryLimit = parseInt(limit) || 5;

    const startIndex = (queryPage - 1) * queryLimit;

    const posts = await postModel.find().sort({ createdAt: -1 }).skip(startIndex).limit(queryLimit).populate({ path: "owner", select: "name _id" })

    if (!posts) return

    const postsDto = posts.map((e) => new PostDto(e))

    return postsDto
  }


  async getImage(refreshToken, params) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const token = await tokenService.findToken(refreshToken)

    if (!userData || !token) throw ApiError.UnauthorizedError()

    console.log(params)

    const filePath = await imageModel.find({ fileName: params })


    return filePath
  }
}



export const imageService = new ImageService()