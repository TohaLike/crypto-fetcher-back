import { userModel } from "../models/user-model.js"
import { v4 as uuid } from 'uuid';
import { mailService } from "./mail-service.js"
import { tokenService } from "./token-service.js"
import bcrypt from "bcrypt"
import UserDto from "../dtos/user-dto.js"
import ApiError from "../exceptions/api-error.js";
import { roomModel } from "../models/room-model.js";
import mongoose from "mongoose";
import { newsModel } from "../models/news-model.js";
import { profileOptionsModel } from "../models/profile-options-model.js";
import { tokenModel } from "../models/token-model.js";

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

    await user.updateOne({ options: options.id })

    // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

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
    // if (!refreshToken) {
    //   throw ApiError.UnauthorizedError()
    // }

    console.log(refreshToken)

    const userData = tokenService.validateRefreshToken(refreshToken)

    console.log(userData)

    const tokenData = await tokenModel.find({ refreshToken })

    console.log(tokenData)

    if (!userData || !tokenData) {
      throw ApiError.UnauthorizedError()
    }

    const user = await userModel.findById(userData.id).populate({ path: "options", select: "image defaultColor" })
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })

    await tokenService.saveToken(userDto.id, tokens.refreshToken)

    return { ...tokens, user: userDto }
  }

  async getProfile(params, refreshToken) {
    if (!mongoose.isObjectIdOrHexString(params.user)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const profile = await userModel.findOne({ _id: params.user }).populate({ path: "options", select: "image defaultColor" })

    if (!profile || !userData) {
      throw ApiError.BadRequest("Пользователь не найден")
    }

    const userDto = new UserDto(profile)

    return userDto
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

    if (!options) {
      const createOptions = await profileOptionsModel.create({ user: userData.id, defaultColor: color, image: file })

      await profile.updateOne({ options: createOptions.id })

      return createOptions
    } else {
      const updateOptions = await profileOptionsModel.findOneAndUpdate({ user: userData.id }, { image: file })

      await profile.updateOne({ options: updateOptions.id })

      return updateOptions
    }
  }

  async getAllUsers(refreshToken) {
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const users = await userModel.find().populate({ path: "options", select: "image defaultColor" })

    const usersDto = users.map((e) => new UserDto(e))

    return usersDto
  }


  async subscribeUser(refreshToken, userId) {
    if (!mongoose.isObjectIdOrHexString(userId)) throw ApiError.InvalidId()

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const news = await newsModel.findOne({ owner: userData.id })
    const checkSubscribe = await newsModel.findOne({ owner: userData.id, newsFrom: { $all: [userId] } })

    if (!news) {
      await newsModel.create({ owner: userData.id, newsFrom: userId })
      return "Created"
    }

    if (!checkSubscribe) {
      news.newsFrom.push(userId)
      return await news.save()
    } else {
      throw ApiError.BadRequest("Пользователь уже находится у вас в друзьях")
    }
  }
}

export const userService = new UserService()