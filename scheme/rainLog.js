import mongoose from "mongoose";

const rainLog = new mongoose.Schema({
    profit: {type: Number},
    oldBalance: {type: Number},
    newBalance: {type: Number},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('rainLog', rainLog)