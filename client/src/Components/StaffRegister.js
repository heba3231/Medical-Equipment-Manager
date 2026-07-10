import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function StaffRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", staffNumber: "", password: "", confirmPassword: "", phone: "", department: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const departments = [
    "OT department", "M.S.W Department", "F.S.W Department", "M.M.W Department",
    "F.M.W Department", "L.C.U Department", "E.N.T Department", "MAT .B Department",
    "M.OT Department", "PAED.A Department", "A/E Department", "ORTH Department",
    "S.OPD Department", "A.N.C Department", "R.D.U Department"
  ];

  const API_URL = `http://${window.location.hostname}:5000/api/staff/register`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
    if (successMessage) setSuccessMessage("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";
    if (!formData.staffNumber.trim()) newErrors.staffNumber = "Staff number is required";
    else if (formData.staffNumber.trim().length < 4) newErrors.staffNumber = "At least 4 characters required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 4) newErrors.password = "At least 4 characters required";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.department) newErrors.department = "Please select a department";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setServerError("");
    setSuccessMessage("");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/StaffLogin"), 2000);
      } else {
        setServerError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setServerError("Server connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-page-left">
        <div className="auth-brand">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <rect x="2" y="2" width="36" height="36" rx="8" fill="#c9a84c"/>
            <path d="M20 9V31M9 20H31" stroke="#004d32" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div className="auth-brand-name">MediTrack</div>
          <div className="auth-brand-sub">Staff Registration</div>
          <div className="auth-brand-hospital">Sultanate of Oman</div>
        </div>
        <div className="auth-page-decor">
          <div className="decor-circle decor-c1"></div>
          <div className="decor-circle decor-c2"></div>
          <div className="decor-circle decor-c3"></div>
        </div>
      </div>

      <div className="auth-page-right register-right">
        <div className="auth-card register-card">
          <div className="auth-card-header">
            <div className="auth-card-icon staff-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="#006341"/>
              </svg>
            </div>
            <div>
              <h1 className="auth-card-title">Create Account</h1>
              <p className="auth-card-sub">Register as a new staff member</p>
            </div>
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}
          {successMessage && <div className="auth-success">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Enter full name" className={errors.name ? "form-input error" : "form-input"}/>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Staff Number <span className="req">*</span></label>
                <input type="text" name="staffNumber" value={formData.staffNumber} onChange={handleChange}
                  placeholder="Enter staff number" className={errors.staffNumber ? "form-input error" : "form-input"}/>
                {errors.staffNumber && <span className="error-text">{errors.staffNumber}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department <span className="req">*</span></label>
              <select name="department" value={formData.department} onChange={handleChange}
                className={errors.department ? "form-input form-select error" : "form-input form-select"}>
                <option value="">Select your department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <span className="error-text">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number <span className="opt">(optional)</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="Enter phone number" className="form-input"/>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Password <span className="req">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  placeholder="Create a password" className={errors.password ? "form-input error" : "form-input"}/>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="req">*</span></label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter password" className={errors.confirmPassword ? "form-input error" : "form-input"}/>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading"><span className="btn-spinner"></span>Registering...</span>
              ) : "Create Account"}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link to="/StaffLogin" className="auth-link">
              Already have an account? <strong>Login here</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffRegister;