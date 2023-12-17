import {CaptchaSolver} from "./captchaSolver.js";
import axios from "axios";
import CookieService from "./services/cookieService.js";
import {SocksProxyAgent} from "socks-proxy-agent";

const RUCAPTCHA_API = "";
const SITEKEY = "61201401-1b32-4fb4-8465-f0a6b6df6d03";
const PAGEURL = "https://clash.gg";

export class ClashGGAPI {
  constructor() {
    this.solver = new CaptchaSolver(RUCAPTCHA_API, SITEKEY, PAGEURL);
    this.cookieService = new CookieService();
  }
  async getAuthHeaders(user) {
    const data = await this.cookieService.findUserCookie(user._id)
    const Cookie = JSON.parse(data.cookie).cookies
    const cookieString = Cookie.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    const headers = {
    //   'authority': 'clash.gg',
    //   'method': 'POST',
    //   'path': '/api/auth/login',
    //   'scheme': 'https',
    //   'Accept': 'application/json',
    //   'Accept-Encoding': 'gzip, deflate, br',
    //   'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6',
    //   'Content-Length': 67,
      'Content-Type': 'application/json',
      'Cookie': cookieString,
      'Origin': 'https://clash.gg',
      'Referer': 'https://clash.gg/',
      'Sec-Ch-Ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': user.userAgent
    };

    return headers
  }

  async getAccessHeaders(user) {
    const data = await this.cookieService.findUserCookie(user._id)
    const Cookie = JSON.parse(data.cookie).cookies
    const cookieString = Cookie.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    const headers = {
      'accept': '*/*',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6',
      'cookie': `refresh_token=${user.refreshToken}; ${cookieString}`,
      'referer': 'https://clash.gg/',
      'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      "if-none-match": "W/\"f9-zS0v5VOSvOKKqDsZUmpbNsHAFfw\"",
      'user-agent': user.userAgent
    };

    return headers
  }

  async getInfoHeaders(user) {
    try {
      const data = await this.cookieService.findUserCookie(user._id)
      const Cookie = JSON.parse(data.cookie).cookies
      const cookieString = Cookie.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
      const headers = {
        "Accept": "application/json",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6",
        "Authorization": `Bearer ${user.accessToken}`,
        "Content-Type": "application/json",
        "Cookie": cookieString,
        "Referer": "https://clash.gg/",
        "Sec-Ch-Ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "Sec-Ch-Ua-Mobile": "?1",
        "Sec-Ch-Ua-Platform": "\"Android\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": user.userAgent
      };

      return headers
    } catch (e) {

    }
  }

  getAgents(user) {
    try {

    } catch (e) {
      console.log(e)
    }
    const proxyParts = user.proxy.split(':');
    const proxyHost = proxyParts[0];
    const proxyPort = proxyParts[1];
    const proxyUsername = proxyParts[2];
    const proxyPassword = proxyParts[3];
    return new SocksProxyAgent(`socks://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`)
  }

  async checkIp(user) {
    try {
      const agent = this.getAgents(user)
      const response = await axios.get('https://api.ipify.org?format=json', {
        httpsAgent: agent
      })
      return response.data.ip
    } catch (e) {
      console.log(e)
    }
  }

  async getRefreshToken(user) {
    try {
      const headers = await this.getAuthHeaders(user);
      const agent = this.getAgents(user)
      const data = {
        username: user.login,
        password: user.password,
      };
      const result = await axios.post('https://clash.gg/api/auth/login', data, {
        headers: {
          ...headers
        },
        httpsAgent: agent,
        withCredentials: true
      })
      const cookieString = result.headers["set-cookie"][0];
      const refreshToken = cookieString.match(/refresh_token=([^;]+)/)[1];
      console.log('Refresh Token:', refreshToken);
      return refreshToken
    } catch (e) {
      console.log(e)
    }
  }

  async getAccessToken(user) {
    try {
      const headers = await this.getAccessHeaders(user);
      const agent = this.getAgents(user);
      console.log(await this.checkIp(user))
      const response = await axios.get("https://clash.gg/api/auth/access-token", {
        withCredentials: true,
        headers: {
          ...headers,
        },
        httpsAgent: agent
      });
      return response.data.accessToken
    } catch (e) {
      console.log(e)
    }
  }

  async getInfo(user) {
    try {
      const headers = await this.getInfoHeaders(user);
      if (headers) {
        const agent = this.getAgents(user);
        const response = await axios.get("https://clash.gg/api/user/me", {
          withCredentials: true,
          headers: {
            ...headers,
          },
          httpsAgent: agent
        });
        return response.data
      }
    } catch (e) {
      console.log(e)
    }
  }

  static connectSocket() {
    //TODO: Подключение к сокету wss://ws.clash.gg/, н БЕЗ авторизации, просто коннектимся и радуемся чему то
  }

  /*
    Вступаем в игру
 */
  async joinToRain(user, token) {
    try {
      const headers = await this.getInfoHeaders(user);
      const agents = this.getAgents(user);
      // console.log('Получаем капчу')
      // console.log(token)
      // console.log(user)
      // let token = await this.solver.solveCaptcha();
      // let ready = false
      // while (!ready) {
      //
      //   const currentTime = new Date();
      //   const currentMinutes = currentTime.getMinutes();
      //
      //   const isWithinTimeRange =
      //       (currentMinutes >= 0 && currentMinutes <= 27) ||
      //       (currentMinutes >= 30 && currentMinutes <= 57);
      //
      //   if (isWithinTimeRange) {
      //     console.log(`Время Rain вышло`);
      //     return "cant_join_now"
      //   }
      //
      //   ready = await this.solver.checkCaptcha(token)
      // }
      //
      // console.log('Прошли капчу')

      // token = ready

      const challenge = this.getClashGGChallenge(token);
      const result = await axios.post(
          "https://clash.gg/api/rain/join",
          {
            challenge,
            token,
          },
          {
            headers: {
              ...headers,
            },
            httpsAgent: agents
          },
      );
      return result
    } catch (e) {
      return e.response
    }
  }

  /*
    Проверяем, в игре мы или нет
   */
  async isParticipating() {
    const res = await axios.get(
      "https://clash.gg/api/battles/rain/is-participating",
    );
    return res.data.isParticipating;
  }

  // async cycle() {
  //   const rucaptchaTaskId = this.solver.solveCaptcha();
  //   let captchasSolution = false;
  //   await new Promise((r) => setTimeout(r, 20000));
  //   while (!captchasSolution) {
  //     const solved = await this.solver.checkCaptcha(rucaptchaTaskId);
  //     if (!solved) {
  //       await new Promise((r) => setTimeout(r, 20000));
  //     } else {
  //       captchasSolution = solved;
  //     }
  //   }
  //   await this.joinToRain("", captchasSolution);
  // }

  getClashGGChallenge(token) {
    const r = token.substr(5, 15);
    const n = r.split("").reduce((e, r) => e + r.charCodeAt(0), 0);
    const i = r.replace(/[a-zA-Z]/g, (e) =>
      String.fromCharCode(
        (e <= "Z" ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26,
      ),
    );
    const e = Date.now();
    const initTs = Date.now() - 40 * 60 * 1000 * Math.random();
    const c01 = ~~((Math.sqrt(e) % 1) * 1e9);
    const c02 = [n, i].join(",");

    const n_to_encrypt = {
      ver: 1,
      its: initTs, //initTs
      cts: Date.now(), // r = 1691416739530
      tim: Date.now - initTs, //я хз че тут было, вроде Date.now- иниттс
      uag: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36", //useragent
      brw: "sel:0,key:0,wda:0,wdb:1",
      ran: Math.random(),
      c01: c01, // ~~(Math.sqrt(e) % 1 * 1e9) где е = cts == Date.now
      c02: c02,
      dif: 0,
    };
    const resultStrRaw = Object.entries(n_to_encrypt)
      .map((e) => {
        let [t, r] = e;
        return t + "=" + r;
      })
      .join(";");

    const res = resultStrRaw.replace(/[a-zA-Z]/g, (e) =>
      String.fromCharCode(
        (e <= "Z" ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26,
      ),
    );

    const encoded = btoa(res);
    return (encoded.substring(30) + encoded.substring(0, 30)).replaceAll(
      "=",
      "",
    );
  }
}
