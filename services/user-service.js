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

class UserService {
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
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const user = await userModel.findById(userData.id)
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

    const profile = await userModel.findOne({ _id: params.user })

    if (!profile || !userData) {
      throw ApiError.BadRequest("Пользователь не найден")
    }

    const userDto = new UserDto(profile)

    return userDto
  }

  async getAllUsers(refreshToken) {
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) throw ApiError.UnauthorizedError()

    const users = await userModel.find()

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