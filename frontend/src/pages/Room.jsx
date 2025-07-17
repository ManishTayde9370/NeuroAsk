import { useParams } from "react-router-dom";
import Question from "./Question";
import { useEffect, useState } from "react";
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
  const currentUser = localStorage.getItem("participant-name") || "Anonymous";

  useEffect(() => {
    // Fetch initial questions
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${serverEndpoint}/room/${code}/question`, { withCredentials: true });
        setQuestions(res.data);
      } catch (err) {
        setQuestions([]);
      }
    };
    fetchQuestions();

    // Connect to socket.io
    const sock = io(serverEndpoint);
    setSocket(sock);
    sock.emit("join", code);

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
        setQuestions((prev) => prev.filter(q => q._id !== id));
        if (socket) socket.emit("deleteQuestion", { roomCode: code, questionId: id });
      } catch (err) {
        alert("Failed to delete question: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="container chat-app-container py-5">
      <h2 className="chat-room-title">Room {code}</h2>
      <div className="chat-box">
        <div className="chat-messages">
          {questions.length === 0 ? (
            <div className="chat-empty">No messages yet.</div>
          ) : (
            questions.map((q) => {
              const isCurrentUser = q.user === currentUser;
              return (
                <div
                  key={q._id}
                  className={`chat-message-row ${isCurrentUser ? "chat-message-right" : "chat-message-left"}`}
                >
                  {!isCurrentUser && (
                    <div className="chat-avatar">
                      <div className="avatar-circle">{getInitials(q.user)}</div>
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
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="chat-avatar">
                      <div className="avatar-circle avatar-user">{getInitials(q.user)}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <Question roomCode={code} />
      </div>
      <style>{`
        .chat-app-container {
          max-width: 700px;
          margin: 0 auto;
        }
        .chat-room-title {
          text-align: center;
          margin-bottom: 1.5rem;
          font-weight: 700;
          color: #3b3b3b;
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