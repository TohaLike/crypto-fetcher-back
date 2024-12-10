import { tokenService } from "./token-service.js"
import ApiError from "../exceptions/api-error.js"
import { postModel } from "../models/post-model.js"

class ImageService {
  async uploadImage(refreshToken, fileData) {
    if (!fileData) throw ApiError.BadRequest("Ошибка загрузки файла")

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    // if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()


    const data = await postModel.create({ testData: "!" })
    console.log(data)


    return data
  }

}



export const imageService = new ImageService()