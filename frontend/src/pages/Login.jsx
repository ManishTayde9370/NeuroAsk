import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!email.trim()) {
      isValid = false;
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      isValid = false;
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      isValid = false;
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        const response = await axios.post(`${serverEndpoint}/auth/login`, {
          email,
          password,
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/");
      } catch (error) {
        setErrors({ message: error.response?.data?.message || "Login failed. Please try again." });
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
              <i className="bi bi-box-arrow-in-right me-2"></i>Login
            </h2>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={errors.email ? "form-control is-invalid" : "form-control"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                <div className="invalid-feedback">{errors.email}</div>
              </div>
              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={errors.password ? "form-control is-invalid" : "form-control"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm position-absolute top-50 end-0 translate-middle-y me-2"
                  tabIndex={-1}
                  style={{zIndex: 2}}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                <div className="invalid-feedback">{errors.password}</div>
              </div>
              <div className="mb-3">
                <button
                  type="submit"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                  disabled={loading}
                >
                  {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                  Login
                </button>
              </div>
              {errors.message && (
                <div className="alert alert-danger">{errors.message}</div>
              )}
            </form>
            <div className="text-center mt-3">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="text-decoration-none">
                  Register here
                </Link>
              </p>
            </div>
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
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
    </div>
  );
}

export default Login; 