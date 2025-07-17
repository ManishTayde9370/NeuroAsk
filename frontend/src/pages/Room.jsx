import { useParams } from "react-router-dom";
import Question from "./Question";
import { useEffect, useState, useRef } from "react";
import { serverEndpoint } from "../config/appConfig";
import axios from "axios";
import { io } from "socket.io-client";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Room() {
  const { code } = useParams();
  const [questions, setQuestions] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomExists, setRoomExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [errors, setErrors] = useState({});
  const codeRef = useRef(null);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available for summary fetch');
        return;
      }
      
      const response = await axios.get(`${serverEndpoint}/room/${code}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setSummaries(response.data || []); 
    } catch (error) {
      console.log(error);
      if (error.response?.status === 403) {
        // User is not the creator, this is expected
        console.log('User is not the room creator, cannot fetch summary');
      } else {
        setErrors({ message: 'Unable to fetch summary, please try again' });
      }
    }
  };

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${serverEndpoint}/room/${code}`, {
        withCredentials: true
      });
      setRoomData(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      if (error.response?.status === 404) {
        setRoomExists(false);
      }
      return null;
    }
  };

  // Fetch current user info from backend
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await axios.get(`${serverEndpoint}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setCurrentUser(null);
      return null;
    }
  };

  useEffect(() => {
    const setup = async () => {
      const user = await fetchCurrentUser();
      const room = await fetchRoom();
      if (!room) {
        setRoomExists(false);
        setLoading(false);
        return;
      }
      if (user && room.createdBy === user.id) {
        setIsCreator(true);
      } else {
        setIsCreator(false);
      }
      // Fetch initial questions
      const fetchQuestions = async () => {
        try {
          const res = await axios.get(`${serverEndpoint}/room/${code}/question`, { withCredentials: true });
          setQuestions(res.data);
          return res.data;
        } catch (err) {
          setQuestions([]);
          return [];
        }
      };
      const questionsData = await fetchQuestions();
      
      // Fetch summary if there are questions
      if (questionsData.length > 0) {
        await fetchSummary();
      }
      
      setLoading(false);
    };

    // Execute validation and setup
    setup();

    // Connect to socket.io
    const sock = io(serverEndpoint);
    setSocket(sock);
    
    sock.on("connect", () => {
      console.log("Connected to server");
      sock.emit("join", code);
    });

    sock.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Listen for new questions
    sock.on("newQuestion", (question) => {
      setQuestions((prev) => [question, ...prev]);
    });

    // Listen for question deletion
    sock.on("deleteQuestion", (questionId) => {
      setQuestions((prev) => prev.filter(q => q._id !== questionId));
    });

    return () => {
      sock.disconnect();
    };
  }, [code]);

  // Delete question handler
  const handleDelete = async (id, user) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await axios.delete(`${serverEndpoint}/room/question/${id}`, {
          data: { userId: currentUser },
          withCredentials: true
        });
        // Note: The backend already emits the deleteQuestion event, so we don't need to emit here
        // The socket listener will handle the UI update automatically
      } catch (err) {
        alert("Failed to delete question: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // Copy room code to clipboard
  const handleCopyCode = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.textContent);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!roomExists) {
    return (
      <div className="container text-center py-5">
        <h2>Room Not Found</h2>
        <p>The room you're looking for doesn't exist or has been deleted.</p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    );
  }

  return (
    <div className="container chat-app-container py-5">
      {/* Room Header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          <h2 className="chat-room-title mb-0">Room <span ref={codeRef}>{code}</span></h2>
          {roomData && (
            <div className="d-flex align-items-center mt-1">
              <span className="badge bg-info me-2">{isCreator ? "Owner" : "Participant"}</span>
              <span className="chat-room-creator text-muted">
                <i className="bi bi-person-circle me-1"></i>
                {roomData.creatorEmail || "Unknown"}
              </span>
              <span className="ms-2" title="The owner can generate summaries. Participants can post questions.">
                <i className="bi bi-info-circle text-secondary"></i>
              </span>
            </div>
          )}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleCopyCode} title="Copy Room Code">
          <i className="bi bi-clipboard"></i>
        </button>
      </div>
      {/* Divider */}
      <hr className="mb-4" />
      {/* Summary Section */}
      <div className="summary-section mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="summary-title mb-0">Question Summary</h5>
          {isCreator && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={fetchSummary}
              disabled={questions.length === 0}
            >
              <i className="bi bi-lightbulb me-1"></i>Refresh Summary
            </button>
          )}
        </div>
        {summaries.length > 0 ? (
          <div className="summary-content">
            {summaries.map((summary, index) => (
              <div key={index} className="summary-item">
                <i className="bi bi-chat-left-text me-2 text-primary"></i>{summary}
              </div>
            ))}
          </div>
        ) : (
          <div className="summary-empty text-muted">
            {questions.length === 0 ? (
              <span><i className="bi bi-emoji-frown me-1"></i>No questions yet. Ask the first question!</span>
            ) : (
              isCreator ? 'Click "Refresh Summary" to generate a summary of questions.' : 'Summary not available yet.'
            )}
          </div>
        )}
      </div>
      {/* Divider */}
      <hr className="mb-4" />
      <div className="chat-box">
        <div className="chat-messages">
          {questions.length === 0 ? (
            <div className="chat-empty text-center text-muted">
              <i className="bi bi-inbox me-2"></i>No messages yet.
            </div>
          ) : (
            questions.map((q) => {
              const isCurrentUser = currentUser && q.user === currentUser.email;
              return (
                <div
                  key={q._id}
                  className={`chat-message-row ${isCurrentUser ? "chat-message-right" : "chat-message-left"}`}
                >
                  {!isCurrentUser && (
                    <div className="chat-avatar">
                      <div className="avatar-circle">
                        <i className="bi bi-person"></i>
                        {getInitials(q.user)}
                      </div>
                    </div>
                  )}
                  <div className="chat-bubble-group">
                    <div className={`chat-bubble ${isCurrentUser ? "chat-bubble-user" : "chat-bubble-other"}`}>
                      <div className="chat-bubble-header">
                        <span className="chat-username">{q.user}</span>
                        <span className="chat-time">{formatTime(q.createdAt)}</span>
                      </div>
                      <div className="chat-bubble-content">{q.content}</div>
                      {isCurrentUser && (
                        <button
                          className="btn btn-sm btn-danger chat-delete-btn"
                          onClick={() => handleDelete(q._id, q.user)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="chat-avatar">
                      <div className="avatar-circle avatar-user">
                        <i className="bi bi-person"></i>
                        {getInitials(q.user)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* Only show Question input if NOT the creator */}
        {!isCreator && <Question roomCode={code} />}
      </div>
      {/* Toast for errors */}
      {errors.message && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{zIndex: 9999, minWidth: 300}}>
          <div className="toast-header bg-danger text-white">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong className="me-auto">Error</strong>
            <button type="button" className="btn-close btn-close-white ms-2 mb-1" onClick={() => setErrors({})}></button>
          </div>
          <div className="toast-body">{errors.message}</div>
        </div>
      )}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style>{`
        .chat-app-container {
          max-width: 700px;
          margin: 0 auto;
        }
        .chat-room-title {
          text-align: center;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: #3b3b3b;
        }
        .chat-room-creator {
          font-size: 0.95rem;
          color: #666;
          margin-bottom: 1.5rem;
        }
        .summary-section {
          background: #fff;
          border-radius: 12px;
          padding: 1.2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8e8e8;
        }
        .summary-title {
          color: #3b3b3b;
          font-weight: 600;
        }
        .summary-content {
          max-height: 200px;
          overflow-y: auto;
        }
        .summary-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .summary-item:last-child {
          border-bottom: none;
        }
        .summary-empty {
          text-align: center;
          padding: 1rem;
          font-style: italic;
        }
        .chat-box {
          background: #f4f7fa;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          padding: 1.5rem 1rem 1rem 1rem;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column-reverse;
        }
        .chat-empty {
          text-align: center;
          color: #aaa;
          margin-top: 2rem;
        }
        .chat-message-row {
          display: flex;
          align-items: flex-end;
          margin-bottom: 0.7rem;
        }
        .chat-message-left {
          flex-direction: row;
        }
        .chat-message-right {
          flex-direction: row-reverse;
        }
        .chat-avatar {
          margin: 0 0.7rem;
        }
        .avatar-circle {
          width: 40px;
          height: 40px;
          background: #b2c2e0;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }
        .avatar-user {
          background: #6ea9d7;
        }
        .chat-bubble-group {
          display: flex;
          flex-direction: column;
          align-items: ${'flex-start'};
        }
        .chat-bubble {
          max-width: 350px;
          padding: 0.7rem 1.1rem;
          border-radius: 18px;
          margin-bottom: 2px;
          position: relative;
          word-break: break-word;
        }
        .chat-bubble-user {
          background: #6ea9d7;
          color: #fff;
          align-self: flex-end;
        }
        .chat-bubble-other {
          background: #fff;
          color: #333;
          border: 1px solid #e0e0e0;
          align-self: flex-start;
        }
        .chat-bubble-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.2rem;
        }
        .chat-username {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .chat-time {
          font-size: 0.8rem;
          color: #888;
          margin-left: 0.7rem;
        }
        .chat-bubble-content {
          font-size: 1.05rem;
        }
        .chat-delete-btn {
          margin-top: 0.3rem;
          padding: 0.1rem 0.7rem;
          font-size: 0.85rem;
        }
        @media (max-width: 600px) {
          .chat-app-container { max-width: 100%; padding: 0; }
          .chat-box { padding: 0.5rem 0.2rem; }
          .chat-bubble { max-width: 90vw; }
        }
      `}</style>
    </div>
  );
}

export default Room;