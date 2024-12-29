import ApiError from "../exceptions/api-error.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { roomModel } from "../models/room-model.js";
import { v4 as uuid } from 'uuid';
import { userModel } from "../models/user-model.js"
import { mailService } from "./mail-service.js"
import { tokenService } from "./token-service.js"
import { newsModel } from "../models/news-model.js";
import { profileOptionsModel } from "../models/profile-options-model.js";
import { friendsModel } from "../models/friends-model.js";
import { subscribersModel } from "../models/subscribers-model.js";
import SubscriptionsDto from "../dtos/subscriptions-dto.js";
import ProfileDto from "../dtos/profile-dto.js";
import UserDto from "../dtos/user-dto.js"

class UserService {
  generateColor(size) {
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async registration(name, email, day, month, year, password) {
    const candidate = await userModel.findOne({ email });

    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с таким email адресом ${email} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid();

    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const createdAt = new Date();

    const user = await userModel.create({ name, email, date, password: hashPassword, activationLink, createdAt });

    const color = this.generateColor(6)

    const options = await profileOptionsModel.create({ user: user.id, defaultColor: color, image: [] })

    const subscribe = await subscribersModel.create({ user: user.id, subscribers: [] })

    const news = await newsModel.create({ owner: user.id, newsFrom: [] })

    // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)

    const userDto = new UserDto(user);

    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    await user.updateOne({ options: options.id, subscribers: subscribe.id, following: news.id })

    return { ...tokens, user: userDto }
  }

  async activate(activationLink) {
    const user = await userModel.findOne({ activationLink })

    if (!user) {
      throw ApiError.BadRequest("Неккоректная ссылка активации")
    }

    user.isActivated = true;
    await user.save()
  }

  async login(email, password) {
    const user = await userModel.findOne({ email })
    if (!user) {
      throw ApiError.BadRequest("Пользователь с таким email не найден")
    }
    const isPassEquals = await bcrypt.compare(password, user.password)

    if (!isPassEquals) {
      throw ApiError.BadRequest("Неверный пароль")
    }

    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })

    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, user: userDto }
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken)
    return token
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const user = await userModel
      .findById(userData.id)
      .populate({ path: "options", select: "image defaultColor" })
      .populate({
        path: "subscribers",
        select: "subscribers",
        populate: {
          path: "subscribers",
          select: "name options",
          options: { limit: 3 },
          populate: {
            path: "options",
            select: "image defaultColor"
          }
        }
      })

    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })



    const profileDto = new ProfileDto(user)

    await tokenService.saveToken(userDto.id, tokens.refreshToken)

    return { ...tokens, user: profileDto }
  }

  async getProfile(params, refreshToken) {
    if (!mongoose.isObjectIdOrHexString(params.user)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    const checkSubscribe = await subscribersModel
      .findOne({ user: params.user, subscribers: { $all: [userData.id] } })

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const profile = await userModel
      .findOne({ _id: params.user })
      .populate({
        path: "options",
        select: "image defaultColor"
      })
      .populate({
        path: "subscribers",
        select: "subscribers",
        populate: {
          path: "subscribers",
          select: "name options",
          options: {
            limit: 2,
            sort: {
              createdAt: - 1
            }
          },
          populate: {
            path: "options",
            select: "image defaultColor"
          }
        }
      })
      .populate({
        path: "following",
        select: "newsFrom",
        populate: {
          path: "newsFrom",
          select: "name options",
          options: {
            limit: 2,
            sort: {
              createdAt: - 1
            }
          },
          populate: {
            path: "options",
            select: "image defaultColor"
          }
        }
      })

    if (!profile || !userData) {
      throw ApiError.BadRequest("Пользователь не найден")
    }

    const profileDto = new ProfileDto(profile)

    return { ...profileDto, checkSubscribe: checkSubscribe && checkSubscribe.id }
  }

  async acceptFriend(refreshToken, userId) {
    // if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    // const userData = tokenService.validateRefreshToken(refreshToken)
    // const tokenFromDb = await tokenService.findToken(refreshToken)

    // if (!userData || !tokenFromDb) {
    //   throw ApiError.UnauthorizedError()
    // }

    // const checkAcceptFriends = await friendsModel.findOne({ users: userId })


    // console.log(checkAcceptFriends)

    // return "null"
  }

  async getFriends(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const friends = await friendsModel.find({ _id: userId })

    return friends
  }

  async getSubscribers(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const subscribers = await subscribersModel.find({ id: userId })

    return subscribers
  }


  async uploadOptions(refreshToken, file) {
    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const options = await profileOptionsModel.findOne({ user: userData.id })
    const profile = await userModel.findOne({ _id: userData.id })

    const color = this.generateColor(6)

    const paths = file.map((e) => e.path)

    if (!options) {
      const createOptions = await profileOptionsModel.create({ user: userData.id, defaultColor: color, image: paths })

      await profile.updateOne({ options: createOptions.id })

      return createOptions
    } else {
      const updateOptions = await profileOptionsModel.findOneAndUpdate({ user: userData.id }, { image: paths })

      await profile.updateOne({ options: updateOptions.id })

      return updateOptions
    }
  }

  async getAllUsers(refreshToken) {
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const users = await userModel.find()
      .populate({ path: "options", select: "image defaultColor", })
      .populate({
        path: "subscribers",
        select: "subscribers",
        populate: {
          path: "subscribers",
          match: { _id: { $in: userData.id } },
          select: "name options",
        }
      })
      .sort({ createdAt: -1 })

    const profileDto = users.map((e) => new ProfileDto(e))

    return profileDto
  }

  async getSubscriptions(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId.user)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const subscribtions = await subscribersModel
      .findOne({ user: userId.user })
      .populate({
        path: "subscribers",
        select: "_id name options",
        populate: [{
          path: "subscribers",
          select: "subscribers",
          populate: {
            path: "subscribers",
            match: { _id: { $in: userData.id } },
            select: "name"
          }
        },
        {
          path: "options",
          select: "image",
        }],
      })

    if (!subscribtions) throw ApiError.BadRequest("Вы ни на кого не подписаны!")

    const subscribtionsDto = new SubscriptionsDto(subscribtions)

    return subscribtionsDto
  }


  async subscribeUser(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const subscribers = await subscribersModel.findOne({ user: userId, })
    const checkSubscribe = await subscribersModel.findOne({ user: userId, subscribers: { $all: [userData.id] } })

    if (!subscribers) {
      await subscribersModel.create({ user: userId, subscribers: userData.id })
    } else {
      if (!checkSubscribe) {
        subscribers.subscribers.push(userData.id)
        return await subscribers.save()
      } else {
        throw ApiError.BadRequest("Вы уже подписаны на пользователя")
      }
    }
  }


  async subscribeNews(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const news = await newsModel.findOne({ owner: userData.id })

    if (!news) {
      await newsModel.create({ owner: userData.id, newsFrom: userId })
    } else {
      const checkSubscribeNews = await newsModel.findOne({ owner: userData.id, newsFrom: { $all: [userId] } })

      if (!checkSubscribeNews) {
        news.newsFrom.push(userId)
        await news.save()
      } else {
        throw ApiError.BadRequest("Вы уже подписаны новости на пользователя")
      }
    }
  }
}

export const userService = new UserService()