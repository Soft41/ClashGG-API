import Router from 'express'
import userController from "../controllers/userController.js";

const userRouter = new Router()

userRouter.post('/addUser', userController.create)
userRouter.post('/getAll', userController.getAll)
userRouter.post('/sendToken', userController.saveToken)

export default userRouter
