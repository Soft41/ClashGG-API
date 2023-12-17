import mongoose from "mongoose";

const user = new mongoose.Schema({
    login: {type: String, required: true},
    password: {type: String, required: true},
    typeAuth: {type: String, required: true},
    proxy: {type: String, required: false},
    userAgent: {type: String, required: false},
    isBanned: {type: String, required: false},
    timeLastKey: {type: Number, required: false},
    balance: {type: Number, required: false},
    dataRegistration: {type: Date, required: false},
    refreshToken: {type: String, required: false},
    accessToken: {type: String, required: false},
    name: {type: String, required: false},
    kycStatus: {type: String, required: false},
})

export default mongoose.model('user', user)