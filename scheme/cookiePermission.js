import mongoose from "mongoose";

const cookiePermission = new mongoose.Schema({
    permission: {type: Boolean, default: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createdAt: { type: Date, expires: 120, default: Date.now }
})

export default mongoose.model('cookiePermission', cookiePermission)