import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: "", 
    staff_no: "", 
    password: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const API_URL = "https://medical-equipment-manager11.onrender.com/api/admin/login";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError("");
    
    if (!formData.name.trim() || !formData.staff_no.trim() || !formData.password.trim()) {
      setServerError("Please fill in all fields");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          staff_no: formData.staff_no.trim(),
          password: formData.password.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const admin = { 
          ...data.admin, 
          role: "admin",
          name: data.admin.name || formData.name.trim()
        };
        
        localStorage.setItem("admin", JSON.stringify(admin));
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userName", admin.name);
        localStorage.setItem("staffNumber", admin.staff_no || formData.staff_no.trim());
        
        if (onLoginSuccess) onLoginSuccess(admin);
        navigate("/");
      } else {
        setServerError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Server connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth-page">
      <div className="auth-page-left admin-left">
        <div className="auth-brand">
          <div className="admin-crown-icon">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="12" fill="rgba(201,168,76,0.15)"/>
              <path d="M10 36L16 20L26 30L36 20L42 36H10Z" fill="#c9a84c"/>
              <circle cx="26" cy="16" r="4" fill="#c9a84c"/>
              <circle cx="10" cy="20" r="3" fill="#c9a84c"/>
              <circle cx="42" cy="20" r="3" fill="#c9a84c"/>
            </svg>
          </div>
          <div className="auth-brand-name">Admin Panel</div>
          <div className="auth-brand-sub">System Administration</div>
          <div className="auth-brand-hospital">MediTrack — Sultanate of Oman</div>
        </div>
      </div>

      <div className="auth-page-right">
        <div className="auth-card admin-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Admin Login</h1>
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input admin-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Staff Number</label>
              <input type="text" name="staff_no" value={formData.staff_no} onChange={handleChange} className="form-input admin-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input admin-input" required />
            </div>

            <button type="submit" className="auth-submit-btn admin-submit-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Login as Admin"}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link to="/StaffLogin" className="auth-link">Staff member? <strong>Go to Staff Login</strong></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;