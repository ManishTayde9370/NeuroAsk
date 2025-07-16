import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function CreateRoom() {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!name.trim()) {
      isValid = false;
      newErrors.name = "Name is mandatory";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        const response = await axios.post(
          `${serverEndpoint}/room`,
          { createdBy: name },
          { withCredentials: true }
        );
        const roomCode = response.data.roomCode;
        navigate(`/room/${roomCode}`);
      } catch (error) {
        console.error(error);
        setErrors({ message: "Error creating room, please try again" });
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4 text-center">Create Room</h2>

          <div className="mb-3">
            <input
              type="text"
              id="name"
              name="name"
              className={errors.name ? "form-control is-invalid" : "form-control"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
            <div className="invalid-feedback">{errors.name}</div>
          </div>

          <div className="mb-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary w-100"
            >
              Submit
            </button>
          </div>

          {errors.message && (
            <div className="alert alert-danger">{errors.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateRoom;
