import cloudCookie from "../scheme/cloudCookie.js";

class CookieService {
  async create(data) {
    return cloudCookie.create(data);
  }

  async get(req, res, next) {}

  async getAll() {
    return cloudCookie.find();
  }

  async findUserCookie(userId) {
    return cloudCookie.findOne({ user: userId });
  }

  async delete(value) {
    return cloudCookie.deleteOne({cookie: value});
  }

  //TODO: Если не лень, добавь функции получения всех кук и фукнцию на удаление конкретной куки.
}

export default CookieService;
