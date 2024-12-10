import { imageService } from "../services/image-service.js"


class ImageController {
  async uploadImage(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      console.log(req.file)
      console.log(req.body)

      // const response = await imageService.uploadImage(refreshToken, req.body)

      return res.json("!")
    } catch (e) {
      next(e)
    }
  }
}


export const imageController = new ImageController()