import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    let isValid = true;
    if (!roomCode.trim()) {
      isValid = false;
      newErrors.roomCode = "Room Code is mandatory";
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrors({ message: "Please login first" });
      return;
    }
    if (validate()) {
      setLoading(true);
      setErrors({});
      setSuccess(false);
      try {
        await axios.post(
          `${serverEndpoint}/room/${roomCode}/join`,
          {},
          { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
          }
        );
        setSuccess(true);
        setTimeout(() => {
          navigate(`/room/${roomCode}`);
        }, 1200);
      } catch (error) {
        if (error.response?.status === 404) {
          setErrors({ roomCode: "Room not found. Please check the room code." });
        } else {
          setErrors({ message: error.response?.data?.message || "Error joining room, please try again" });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm p-4">
            <h2 className="mb-4 text-center">
              <i className="bi bi-box-arrow-in-right me-2"></i>Join Room
            </h2>
            <p className="text-muted text-center mb-4">
              Enter the room code provided by your host to join the Q&A session.
            </p>
            <div className="mb-3">
              <input
                type="text"
                id="roomCode"
                name="roomCode"
                className={errors.roomCode ? "form-control is-invalid" : "form-control"}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter room code"
                disabled={loading}
              />
              <div className="invalid-feedback">{errors.roomCode}</div>
            </div>
            <div className="mb-3">
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Join Room
              </button>
            </div>
            {errors.message && (
              <div className="alert alert-danger">{errors.message}</div>
            )}
            {success && (
              <div className="alert alert-success d-flex align-items-center">
                <i className="bi bi-check-circle me-2"></i>
                Joined room! Redirecting...
              </div>
            )}
          </div>
        </div>
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
      {/* Toast for success */}
      {success && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{zIndex: 9999, minWidth: 300}}>
          <div className="toast-header bg-success text-white">
            <i className="bi bi-check-circle me-2"></i>
            <strong className="me-auto">Success</strong>
          </div>
          <div className="toast-body">
            Joined room! Redirecting...
          </div>
        </div>
      )}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
    </div>
  );
}

export default JoinRoom;