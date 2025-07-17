# Smart-QA Setup Guide

## Environment Configuration

### Backend Setup
Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URL=mongodb://localhost:27017/smart-qa

# Server Configuration
PORT=5000

# Client URL for CORS
CLIENT_URL=http://localhost:5173

# JWT Secret (if implementing authentication)
JWT_SECRET=your-secret-key-here
```

### Frontend Setup
Create a `.env` file in the `frontend/` directory with:

```env
# Backend Server Endpoint
VITE_SERVER_ENDPOINT=http://localhost:5000
```

## Installation & Running

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Current Logic Improvements Made

1. **Room Validation**: Added validation in JoinRoom component to check if room exists before joining
2. **Socket Connection**: Improved socket.io connection handling with proper error handling
3. **Room Loading States**: Added loading and error states for room access
4. **Error Handling**: Enhanced error messages and user feedback
5. **Socket Event Cleanup**: Removed redundant socket emits

## Still Missing Features

1. **User Authentication**: No proper user session management
2. **Room Cleanup**: No automatic cleanup of inactive rooms
3. **User Presence**: No real-time user presence indicators
4. **Room Access Control**: No validation of room membership
5. **Rate Limiting**: No protection against spam
6. **Input Sanitization**: No XSS protection for user inputs 