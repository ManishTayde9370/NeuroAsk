const mongoose = require('mongoose');

const questionsSchema = new mongoose.Schema({
    roomCode: { type: String, required: true },
    content: { type: String, required: true },
    user: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Question", questionsSchema);