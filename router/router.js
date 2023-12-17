import Router from 'express'
import cookieController from "../controllers/cookieController.js";
import webSocketController from "../controllers/webSocketController.js";
const router = new Router()

router.post('/needCookie', cookieController.demandCheck)
router.post('/sendCookie', cookieController.create)
router.post('/webSocket', webSocketController.log)

export default router
