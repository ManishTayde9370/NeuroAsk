// models/Rooms.js
const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true }, // Accept string name instead of ObjectId
  participants: [{ type: String }], // Array of user IDs
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Rooms", roomsSchema);