import { userModel } from "../models/user-model.js"
import { v4 as uuid } from 'uuid';
import bcrypt from "bcrypt"
import { mailService } from "./mail-service.js"
import { tokenService } from "./token-service.js"
import UserDto from "../dtos/user-dto.js"
import ApiError from "../exceptions/api-error.js";

class UserService {
  async registration(email, password) {
    const candidate = await userModel.findOne({ email })

    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с таким email адресом ${email} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 3)
    const activationLink = uuid()

    const user = await userModel.create({ email, password: hashPassword, activationLink })
    await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)

    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)

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
}

export const userService = new UserService()