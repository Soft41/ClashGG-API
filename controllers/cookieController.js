import CookieService from "../services/cookieService.js";
import userService from "../services/userService.js";
import { Mutex } from "async-mutex"; // Подключаем библиотеку для работы с мьютексами
import cookiePermissionService from "../services/cookiePermissionService.js";

const cookieServiceInstance = new CookieService();
const statusMutex = new Mutex(); // Создаем мьютекс


class cookieController {
    async create(req,res,next) {
        try{
            const maybeData = JSON.parse(req.query.cookie).cookies
            if (maybeData.length !== 0) {
                const allCookie = JSON.parse(req.query.cookie)
                const hasCfClearanceCookie = allCookie.cookies.some((cookie) => cookie.name === 'cf_clearance');
                if (hasCfClearanceCookie) {
                    const data = await cookieServiceInstance.create(req.query)
                }
            }
            // console.log(`Action is unlocked for user ${req.query.userLogin}`);
            await cookiePermissionService.delete(req.query.user)
            res.status(400).json('OK')
        } catch (e) {
            console.log(e)
        }
    }

    async get(req,res,next) {

    }

    async delete(req,res,next) {

    }

    async demandCheck(req, res, next) {
        try {
            const release = await statusMutex.acquire();
            const allUsers = await userService.getAll();

            for (const user of allUsers) {
                const cookie = await cookieServiceInstance.findUserCookie(user._id);

                if (!cookie) {
                    const permission = await cookiePermissionService.findPermissionUser(user._id)
                    if (!permission) {
                        await cookiePermissionService.create({
                            user: user._id
                        })

                        try {
                            console.log(`Action is locked for user ${user.login}`);
                            return res.status(400).json({
                                user: user._id,
                                proxy: user.proxy,
                                userAgent: user.userAgent,
                                userLogin: user.login
                            });
                        } finally {
                            release();
                        }
                    }
                }
            }
            release();
            return res.status(400).json(false);
        } catch (error) {
            console.error("Error in demandCheck:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
}

export default new cookieController()