import mongoose from "mongoose";

const clodCookie = new mongoose.Schema({
    cookie: {type: String, required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createdAt: { type: Date, expires: 86400, default: Date.now }
})

export default mongoose.model('cloudCookie', clodCookie)