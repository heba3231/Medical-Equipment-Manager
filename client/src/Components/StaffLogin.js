import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../Images/logo.png";

function StaffLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ staffNumber: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const API_URL = `http://${window.location.hostname}:5000/api/staff/login`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (serverError) setServerError("");
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staffNumber.trim()) newErrors.staffNumber = "Staff number is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setServerError("");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        const user = { ...data.user, role: "staff" };
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", "staff");
        if (onLoginSuccess) onLoginSuccess(user);
        navigate("/");
      } else {
        setServerError(data.message || "Invalid staff number or password");
      }
    } catch (err) {
      setServerError("Server connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-left">
        <div className="auth-brand">

          {/* ✅ الشعار من الهيدر بدل SVG و MediTrack */}
          <img
            src={logo}
            alt="MediTrack Logo"
            style={{
              width: "260px",
              height: "170px",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />

          <div className="auth-brand-sub">Medical Equipment Tracking System</div>
          <div className="auth-brand-hospital">Sultanate of Oman</div>
        </div>
        <div className="auth-page-decor">
          <div className="decor-circle decor-c1"></div>
          <div className="decor-circle decor-c2"></div>
          <div className="decor-circle decor-c3"></div>
        </div>
      </div>

      <div className="auth-page-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-icon staff-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#006341"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#006341"/>
              </svg>
            </div>
            <div>
              <h1 className="auth-card-title">Staff Login</h1>
              <p className="auth-card-sub">Enter your credentials to continue</p>
            </div>
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Staff Number</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#006341" strokeWidth="2"/>
                  <path d="M7 9H17M7 13H13" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  name="staffNumber"
                  value={formData.staffNumber}
                  onChange={handleChange}
                  placeholder="Enter your staff number"
                  className={errors.staffNumber ? "form-input error" : "form-input"}
                />
              </div>
              {errors.staffNumber && <span className="error-text">{errors.staffNumber}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="#006341" strokeWidth="2"/>
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#006341" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1.5" fill="#006341"/>
                </svg>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? "form-input error" : "form-input"}
                />
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading"><span className="btn-spinner"></span>Logging in...</span>
              ) : "Login"}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link to="/StaffRegister" className="auth-link">
              Don't have an account? <strong>Register here</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;