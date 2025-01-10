import { validationResult } from "express-validator";
import { imageService } from "../services/image-service.js"
import ApiError from "../exceptions/api-error.js";


class ImageController {
  async uploadPost(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { description } = req.body

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Ошибка при валидации", errors.array()))
      }

      const response = await imageService.uploadPost(refreshToken, description, req.files)

      return res.json(response)
    } catch (e) {
      next(e)
    }
  }

  async getPosts(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { page } = req.query

      const images = await imageService.getSubscribePosts(refreshToken, page)

      return res.json(images)
    } catch (e) {
      next(e)
    }
  }


  async loadMore(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { createdAt } = req.body

      const loadMore = await imageService.loadMore(refreshToken, createdAt)

      return res.json(loadMore)
    } catch (e) {
      next(e)
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { params } = req

      const userPosts = await imageService.getUserPosts(refreshToken, params)

      return res.json(userPosts)
    } catch (e) {
      next(e)
    }
  }

  // async deleteProfileImage(req, res, next) {
  //   try {
  //     const { refreshToken } = req.cookies


  //   } catch (e) {
  //     next(e)
  //   }
  // }

  async deletePost(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { postId } = req.body

      const deletePost = await imageService.deletePost(refreshToken, postId)

      return res.json(deletePost)
    } catch (e) {
      next(e)
    }
  }
}


export const imageController = new ImageController()