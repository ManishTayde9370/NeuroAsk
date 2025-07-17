import { useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function Question({ roomCode }) {
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!question.trim()) {
      isValid = false;
      newErrors.question = "Question is mandatory";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        const participantName = localStorage.getItem("participant-name") || "Anonymous";
        const response = await axios.post(
          `${serverEndpoint}/room/${roomCode}/question`,
          { content: question, user: participantName },
          { withCredentials: true }
        );
        setQuestion("");
      } catch (error) {
        setErrors({ message: "Error posting question, please try again" });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="chat-input-wrapper">
        <input
          type="text"
          id="question"
          name="question"
          className={`chat-input ${errors.question ? "is-invalid" : ""}`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || !question.trim()}
        >
          <span role="img" aria-label="Send">➤</span>
        </button>
      </div>
      {errors.question && <div className="invalid-feedback d-block">{errors.question}</div>}
      {errors.message && <div className="alert alert-danger mt-2">{errors.message}</div>}
      <style>{`
        .chat-input-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .chat-input-wrapper {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          padding: 0.3rem 0.7rem 0.3rem 1.1rem;
        }
        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 1.1rem;
          padding: 0.7rem 0.5rem;
          border-radius: 24px;
        }
        .chat-input.is-invalid {
          border: 1.5px solid #e74c3c;
          background: #fff6f6;
        }
        .chat-send-btn {
          background: #6ea9d7;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-left: 0.5rem;
          transition: background 0.2s;
          box-shadow: 0 2px 8px rgba(110,169,215,0.08);
        }
        .chat-send-btn:disabled {
          background: #b2c2e0;
          cursor: not-allowed;
        }
        .invalid-feedback {
          color: #e74c3c;
          font-size: 0.97rem;
          margin-top: 0.2rem;
        }
        @media (max-width: 600px) {
          .chat-input-form { padding: 0 0.2rem; }
          .chat-input-wrapper { padding: 0.2rem 0.3rem 0.2rem 0.5rem; }
        }
      `}</style>
    </form>
  );
}

export default Question;