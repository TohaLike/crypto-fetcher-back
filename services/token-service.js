import jwt from "jsonwebtoken"
import { tokenModel } from "../models/token-model.js"

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, "jwt-secret-key", { expiresIn: "30m" })
    const refreshToken = jwt.sign(payload, "jwt-refresh-secret-key", { expiresIn: "30w" })

    return { accessToken, refreshToken }
  }

  validateAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      return userData
    } catch (e) {
      return null
    }
  }

  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
      return userData
    } catch (e) {
      return null
    }
  }

  async saveToken(userId, refreshToken) {
    const tokenData = await tokenModel.findOne({ user: userId })

    if (tokenData) {
      tokenData.refreshToken = refreshToken
      return tokenData.save()
    }

    const token = await tokenModel.create({ user: userId, refreshToken })
    return token;
  }

  async removeToken(refreshToken) {
    const tokenData = await tokenModel.deleteOne({ refreshToken })
    return tokenData
  }

  async findToken(refreshToken) {
    const tokenData = await tokenModel.findOne({ refreshToken })
    return tokenData
  }
}

export const tokenService = new TokenService()