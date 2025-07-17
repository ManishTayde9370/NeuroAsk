const mongoose = require("mongoose");
const Rooms = require("../models/Rooms");
const Questions = require("../models/Questions");
const { callGemini } = require("../services/geminiService");
const auth = require("../middleware/auth");
const User = require("../models/User");

const roomController = {
  createRoom: [auth, async (req, res) => {
    try {
      const createdBy = req.user.id;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = await Rooms.create({
        roomCode: code,
        createdBy,
        participants: [createdBy],
      });
      res.json({ roomCode: room.roomCode });
    } catch (error) {
      console.error("createRoom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }],

  getByRoomId: async (req, res) => {
    try {
      const code = req.params.code;

      const room = await Rooms.findOne({ roomCode: code, isActive: true });
      if (!room) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      const creator = await User.findById(room.createdBy).select("email");
      res.json({ ...room.toObject(), creatorEmail: creator ? creator.email : "Unknown" });
    } catch (error) {
      console.error("getByRoomId error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  createQuestions: [auth, async (req, res) => {
    try {
      const { content } = req.body;
      const roomCode = req.params.code;
      const userId = req.user.id;
      const userName = req.user.email;
      
      // Input validation
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Question content is required" });
      }
      
      if (content.trim().length > 500) {
        return res.status(400).json({ message: "Question is too long (max 500 characters)" });
      }
      
      // Basic XSS protection - remove script tags
      const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      const room = await Rooms.findOne({ roomCode, isActive: true });
      if (!room) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      
      if (room.createdBy === userId) {
        return res.status(403).json({ message: "Room creator cannot post questions" });
      }
      
      if (!room.participants.includes(userId)) {
        return res.status(403).json({ message: "Only participants can post questions" });
      }
      
      // Rate limiting: Check if user has posted too recently (within 10 seconds)
      const recentQuestion = await Questions.findOne({
        roomCode: roomCode,
        user: userName,
        createdAt: { $gte: new Date(Date.now() - 10000) } // 10 seconds ago
      });
      
      if (recentQuestion) {
        return res.status(429).json({ message: "Please wait before posting another question" });
      }
      
      const question = await Questions.create({
        roomCode: roomCode,
        content: sanitizedContent,
        user: userName,
      });
      
      const io = req.app.get("io");
      io.to(roomCode).emit("newQuestion", question);
      res.json(question);
    } catch (error) {
      console.error("createQuestions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }],

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

      const roomCode = question.roomCode;
      await question.deleteOne();

      // Emit delete event to all clients in the room
      const io = req.app.get("io");
      io.to(roomCode).emit("deleteQuestion", questionId);

      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("deleteQuestion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  summarizeQuestions: [auth, async (request, response) => {
    try {
      const { code } = request.params;
      const userId = request.user.id;
      const room = await Rooms.findOne({ roomCode: code, isActive: true });
      if (!room) return response.status(404).json({ message: 'Room not found or inactive' });
      if (room.createdBy !== userId) return response.status(403).json({ message: 'Only the room creator can summarize questions' });
      const questions = await Questions.find({ roomCode: code });
      if (questions.length === 0) return response.json([]);
      const summary = await callGemini(questions);
      response.json(summary);
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: 'Internal Server error' });
    }
  }],

  joinRoom: [auth, async (req, res) => {
    try {
      const code = req.params.code;
      const userId = req.user.id;
      const room = await Rooms.findOne({ roomCode: code, isActive: true });
      if (!room) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
        await room.save();
      }
      res.json({ message: "Joined room", roomCode: code });
    } catch (error) {
      console.error("joinRoom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }],

  // Cleanup inactive rooms (older than 24 hours)
  cleanupRooms: async (req, res) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await Rooms.updateMany(
        { 
          createdAt: { $lt: twentyFourHoursAgo },
          isActive: true 
        },
        { isActive: false }
      );
      res.json({ 
        message: `Deactivated ${result.modifiedCount} inactive rooms`,
        deactivatedCount: result.modifiedCount 
      });
    } catch (error) {
      console.error("cleanupRooms error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = roomController;