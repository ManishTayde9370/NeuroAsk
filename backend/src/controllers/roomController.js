const mongoose = require("mongoose");
const Rooms = require("../models/Rooms");
const Questions = require("../models/Questions");

const roomController = {
  createRoom: async (req, res) => {
    try {
      const createdBy = req.body.createdBy || req.user?._id; // from body or auth middleware

      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const room = await Rooms.create({
        roomCode: code,
        createdBy,
      });

      res.json(room);
    } catch (error) {
      console.error("createRoom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getByRoomId: async (req, res) => {
    try {
      const code = req.params.code;

      const room = await Rooms.findOne({ roomCode: code });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error("getByRoomId error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  createQuestions: async (req, res) => {
    try {
      const { content, user } = req.body;
      const roomCode = req.params.code;

      const question = await Questions.create({
        roomCode,
        content,
        user,
      });

      res.json(question);
    } catch (error) {
      console.error("createQuestions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getQuestions: async (req, res) => {
    try {
      const code = req.params.code;

      const questions = await Questions.find({ roomCode: code }).sort({
        createdAt: -1,
      });

      res.json(questions);
    } catch (error) {
      console.error("getQuestions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const code = req.params.code;
      const userId = req.body.userId;

      const room = await Rooms.findOne({ roomCode: code });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.createdBy || room.createdBy.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this room" });
      }

      await Questions.deleteMany({ roomCode: code });
      await room.deleteOne();

      res.json({ message: "Room and associated questions deleted successfully" });
    } catch (error) {
      console.error("deleteRoom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteQuestion: async (req, res) => {
    try {
      const questionId = req.params.id;
      const userId = req.body.userId;

      if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ message: "Invalid question ID format" });
      }

      const question = await Questions.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      if (!question.user || question.user.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this question" });
      }

      await question.deleteOne();
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("deleteQuestion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = roomController;
