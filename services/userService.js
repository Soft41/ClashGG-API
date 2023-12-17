import user from "../scheme/user.js";

class userService {
    async create(data) {
        console.log(data)
        return user.create(data);
    }

    async getAll() {
        return user.find();
    }

    async update(userId, update) {
        return user.findByIdAndUpdate(userId, update, {new: true});
    }

    async findUser(email) {
        return user.findOne({login: email})
    }
}

export default new userService()