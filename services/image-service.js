import { tokenService } from "./token-service.js"
import ApiError from "../exceptions/api-error.js"
import { postModel } from "../models/post-model.js"

class ImageService {
  async uploadImage(refreshToken, text, files) {
    // if (!files) throw ApiError.BadRequest("Ошибка загрузки файла")

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()


    const data = await postModel.create({ owner: userData.id, text: text, images: [...files] })

    return data
  }



  async getPosts(refreshToken) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const token = tokenService.findToken(refreshToken)

    if (!userData || !token) throw ApiError.UnauthorizedError()

    const images = await postModel.find()

    return images
  }
}



export const imageService = new ImageService()