import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function CreateRoom() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrors({ message: "Please login first" });
      return;
    }
    setLoading(true);
    setErrors({});
    setSuccess(false);
    try {
      const response = await axios.post(
        `${serverEndpoint}/room`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        }
      );
      setRoomCode(response.data.roomCode);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/room/${response.data.roomCode}`);
      }, 1200);
    } catch (error) {
      setErrors({ message: error.response?.data?.message || "Error creating room, please try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm p-4">
            <h2 className="mb-4 text-center">
              <i className="bi bi-plus-circle me-2"></i>Create Room
            </h2>
            <p className="text-muted text-center mb-4">
              As a host, you can create a new Q&A room. Share the room code with your participants.
            </p>
            <div className="mb-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Create Room
              </button>
            </div>
            {errors.message && (
              <div className="alert alert-danger">{errors.message}</div>
            )}
            {success && (
              <div className="alert alert-success d-flex align-items-center">
                <i className="bi bi-check-circle me-2"></i>
                Room created! Redirecting...<br />
                <span className="fw-bold">Room Code: {roomCode}</span>
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
            Room created!<br />
            <span className="fw-bold">Room Code: {roomCode}</span>
          </div>
        </div>
      )}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
    </div>
  );
}

export default CreateRoom;