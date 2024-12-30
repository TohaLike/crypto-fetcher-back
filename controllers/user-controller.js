import { validationResult } from "express-validator"
import { userService } from "../services/user-service.js"
import ApiError from "../exceptions/api-error.js";

class UserContoller {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Ошибка при валидации", errors.array()))
      }
      const { name, email, day, month, year, password } = req.body

      const userData = await userService.registration(name, email, day, month, year, password);


      // console.log(userData.refreshToken, "registration")
      // secure: true, sameSite: 'none'

      res.cookie("refreshToken", userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, })
      return res.json(userData)
    } catch (e) {
      next(e)
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await userService.login(email, password)
      res.cookie("refreshToken", userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, })
      return res.json(userData)
    } catch (e) {
      next(e)
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await userService.logout(refreshToken)
      res.clearCookie("refreshToken")
      return res.json(token)
    } catch (e) {
      next(e)
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const userData = await userService.refresh(refreshToken)

      if (!userData) return res.clearCookie("refreshToken")

      res.cookie("refreshToken", userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, })

      return res.json(userData)
    } catch (e) {
      next(e)
    }
  }

  async activate(req, res, next) {
    try {
      const activationLink = req.params.link
      await userService.activate(activationLink)
      return res.redirect(process.env.CLIENT_URL)
    } catch (e) {
      next(e)
    }
  }

  async getProfile(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { params } = req
      const profile = await userService.getProfile(params, refreshToken)

      return res.json(profile)
    } catch (e) {
      next(e)
    }
  }

  async getUsers(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const users = await userService.getAllUsers(refreshToken);
      return res.json(users)
    } catch (e) {
      next(e)
    }
  }

  async subscribeUser(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { userId } = req.body

      const newsFrom = await userService.subscribeUser(refreshToken, userId)

      return res.json(newsFrom)
    } catch (e) {
      next(e)
    }
  }

  async subscribeNews(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const { userId } = req.body

      const newsFrom = await userService.subscribeNews(refreshToken, userId)

      return res.json(newsFrom)
    } catch (e) {
      next(e)
    }
  }


  async getFollowings(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const getFollowings = await userService.getFollowings(refreshToken, req.params)

      return res.json(getFollowings)
    } catch (e) {
      next(e)
    }
  }

  async getSubscriptions(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const getSubscriptions = await userService.getSubscriptions(refreshToken, req.params)

      return res.json(getSubscriptions)
    } catch (e) {
      next(e)
    }
  }


  async uploadOptions(req, res, next) {
    try {
      const { refreshToken } = req.cookies

      const uploadOptions = await userService.uploadOptions(refreshToken, req.files)

      return res.json(uploadOptions)
    } catch (e) {
      next(e)
    }
  }
}


export const userControllers = new UserContoller()