import { userModel } from "../models/user-model.js"
import { v4 as uuid } from 'uuid';
import { mailService } from "./mail-service.js"
import { tokenService } from "./token-service.js"
import bcrypt from "bcrypt"
import UserDto from "../dtos/user-dto.js"
import ApiError from "../exceptions/api-error.js";

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

  async getProfile(params) {
    const profile = await userModel.findOne({ _id: params.user })

    const userDto = new UserDto(profile)

    return userDto
  }

  async getAllUsers() {
    const users = await userModel.find()
    return users
  }
}

export const userService = new UserService()