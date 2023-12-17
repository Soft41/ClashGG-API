import {ClashGGAPI} from "../clashGG-API.js";
import userController from "../controllers/userController.js";
import userService from "../services/userService.js";
import CookieService from "../services/cookieService.js";
import RefreshService from "../services/refreshService.js";
export class Worker {
  constructor(user) {
    this.user = user;
    this.clashGGApi = new ClashGGAPI();
    this.cookieService = new CookieService();
    this.refreshService = new RefreshService();
  }

  async init() {
    try {
      const cookie = await this.cookieService.findUserCookie(this.user._id)

      if (!cookie) {
        console.log('No cookie in DB')
        return false
      }

      const data = await this.refreshService.findUserCookie(this.user._id)
      let refreshToken = data.refreshToken

      if (!refreshToken) {
        refreshToken = await this.clashGGApi.getRefreshToken(this.user)
        console.log(refreshToken)
        this.user.refreshToken = refreshToken
        await this.refreshService.create({
          user: this.user._id,
          refreshToken: refreshToken
        })
      } else {
        this.user.refreshToken = refreshToken
      }



      const accessToken = await this.clashGGApi.getAccessToken(this.user);

      this.user = await userService.update(this.user._id, {
        accessToken: accessToken
      })
      return true
    } catch (e) {
      return false
    }

  }

  async joinToRain(token) {
    return await this.clashGGApi.joinToRain(this.user, token)
  }

  async updateInfo() {
    try {
      const updateInfo = await this.clashGGApi.getInfo(this.user)
      // console.log(updateInfo)

      this.user = await userService.update(this.user._id, {
        isBanned: updateInfo.bannedUntil,
        balance: updateInfo.balance,
        kycStatus: updateInfo.kycStatus,
        name: updateInfo.name
      })
    } catch (e) {

    }
    // console.log(this.user)
  }
}
