import userService from "../services/userService.js";
import RefreshService from "../services/refreshService.js";

class userController {
    async create(req,res,next) {
        console.log(req.query)
        const data = await userService.create(req.query)
        console.log(data)
        res.status(400).json(data)
    }

    async get(req,res,next) {

    }

    async getAll(req,res,next) {
        const users = await userService.getAll()
        let message = ``
        for (const user of users) {
            message += `${user.login}:${user.password}:${user.proxy}:1:${user.userAgent} \n`
        }
        console.log(message)
        res.status(400).json(message)
    }

    async delete(req,res,next) {

    }

    async saveToken(req,res,next) {
        const refreshToken = req.query.refreshToken
        const email = req.query.email
        console.log(email)
        const user = await userService.findUser(email)
        let service = new RefreshService()
        console.log(user)
        await service.create({
            user: user._id,
            refreshToken: refreshToken
        })

        res.json(true).status(200)
    }

}
export default new userController()