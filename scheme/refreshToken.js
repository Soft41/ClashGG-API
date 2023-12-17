import mongoose from "mongoose";

const refreshToken = new mongoose.Schema({
    refreshToken: {type: String, required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createdAt: { type: Date, expires: 2505600, default: Date.now }
})

export default mongoose.model('refreshToken', refreshToken)