import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-md-8 text-center">
          <div className="mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/3062/3062634.png" alt="QA" width={80} height={80} />
          </div>
          <h1 className="display-5 fw-bold mb-3">Welcome to SmartQA</h1>
          <p className="lead mb-4">
            <strong>SmartQA</strong> is a real-time Q&A platform for interactive sessions, classrooms, and webinars. Create a room, invite participants, and manage questions efficiently with AI-powered summaries.
          </p>
        </div>
      </div>
      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="card shadow-sm p-4">
            <h4 className="mb-3">How it works</h4>
            <ol className="text-start mb-0">
              <li><strong>Register or Login</strong> to your account.</li>
              <li><strong>Create a Room</strong> (as host) or <strong>Join a Room</strong> (as participant).</li>
              <li>Share the <strong>Room Code</strong> with your audience.</li>
              <li>Participants can post questions. The host can generate AI-powered summaries.</li>
              <li>Enjoy a smooth, interactive Q&A experience!</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          {isAuthenticated ? (
            <>
              <p className="mb-3">
                Welcome, <strong>{user?.email}</strong>!
              </p>
              <div className="mb-4">
                <Link to="/create" className="btn btn-primary btn-lg mx-2">
                  <i className="bi bi-plus-circle me-2"></i>Create Room
                </Link>
                <Link to="/join" className="btn btn-success btn-lg mx-2">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Join Room
                </Link>
              </div>
              <button onClick={handleLogout} className="btn btn-outline-secondary">
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <Link to="/login" className="btn btn-primary btn-lg mx-2">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Login
                </Link>
                <Link to="/register" className="btn btn-success btn-lg mx-2">
                  <i className="bi bi-person-plus me-2"></i>Register
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <footer className="text-center mt-5 text-muted small">
        <hr />
        <div>Contact: <a href="mailto:support@smartqa.com">support@NeuroAsk.com</a></div>
      </footer>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
    </div>
  );
}

export default Home;