class webSocketController {
    async log(req,res,next) {
        const data = req.query.message
        console.log(data)
        res.status(200).json(true)
    }
}
export default new webSocketController()