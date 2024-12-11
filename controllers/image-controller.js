import { validationResult } from "express-validator";
import { imageService } from "../services/image-service.js"
import ApiError from "../exceptions/api-error.js";


class ImageController {
  async uploadImage(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { description } = req.body

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Ошибка при валидации", errors.array()))
      }

      const response = await imageService.uploadImage(refreshToken, description, req.files)

      return res.json(response)
    } catch (e) {
      next(e)
    }
  }

  async getPosts(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { page } = req.query

      const images = await imageService.getPosts(refreshToken, page)

      return res.json(images)
    } catch (e) {
      next(e)
    }
  }


  async getImage(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { params } = req

      const file = await imageService.getImage(refreshToken, params)

      console.log(file)

      return res.sendFile(file)
    } catch (e) {
      next(e)
    }
  }
}


export const imageController = new ImageController()