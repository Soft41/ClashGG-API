import refreshToken from "../scheme/refreshToken.js";

class RefreshService {
    async create(data) {
        return refreshToken.create(data);
    }

    async get(req, res, next) {}

    async getAll() {
        return refreshToken.find();
    }

    async findUserCookie(userId) {
        const data = await refreshToken.findOne({user: userId});
        if (data) {
            return data
        } else {
            return false
        }
    }

    async delete(value) {
        return refreshToken.deleteOne({cookie: value});
    }
}

export default RefreshService;
