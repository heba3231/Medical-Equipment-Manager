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

  const API_URL = `http://${window.location.hostname}:5000/api/admin/login`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError("");
    
    // ✅ التحقق من إدخال جميع الحقول
    if (!formData.name.trim()) {
      setServerError("Please enter your full name");
      setIsLoading(false);
      return;
    }
    if (!formData.staff_no.trim()) {
      setServerError("Please enter staff number");
      setIsLoading(false);
      return;
    }
    if (!formData.password.trim()) {
      setServerError("Please enter password");
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
        // ✅ حفظ بيانات الأدمن مع الاسم المدخل
        const admin = { 
          ...data.admin, 
          role: "admin",
          name: data.admin.name || formData.name.trim()
        };
        
        // ✅ حفظ في localStorage
        localStorage.setItem("admin", JSON.stringify(admin));
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userName", admin.name); // ✅ هذا الاسم سيظهر في التشييك
        localStorage.setItem("staffNumber", admin.staff_no || formData.staff_no.trim());
        localStorage.setItem("adminName", admin.name); // ✅ نسخة احتياطية
        
        // ✅ استدعاء دالة النجاح إذا وجدت
        if (onLoginSuccess) onLoginSuccess(admin);
        
        // ✅ التوجيه إلى الصفحة الرئيسية
        navigate("/");
      } else {
        setServerError(data.message || "Invalid credentials. Please check your name, staff number, or password.");
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
        <div className="auth-page-decor">
          <div className="decor-circle decor-c1 admin-decor"></div>
          <div className="decor-circle decor-c2 admin-decor"></div>
          <div className="decor-circle decor-c3 admin-decor"></div>
        </div>
      </div>

      <div className="auth-page-right">
        <div className="auth-card admin-card">
          <div className="auth-card-header">
            <div className="auth-card-icon admin-icon">
              <svg width="24" height="24" viewBox="0 0 52 52" fill="none">
                <path d="M10 36L16 20L26 30L36 20L42 36H10Z" fill="#c9a84c"/>
                <circle cx="26" cy="14" r="5" fill="#c9a84c"/>
              </svg>
            </div>
            <div>
              <h1 className="auth-card-title">Admin Login</h1>
              <p className="auth-card-sub">Restricted access — authorized personnel only</p>
            </div>
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* ✅ حقل الاسم الكامل */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input admin-input"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* ✅ حقل رقم الموظف */}
            <div className="form-group">
              <label className="form-label">Staff Number</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 9H17M7 13H13" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  name="staff_no"
                  value={formData.staff_no}
                  onChange={handleChange}
                  placeholder="Enter admin staff number"
                  className="form-input admin-input"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* ✅ حقل كلمة المرور */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" />
                  <circle cx="12" cy="16" r="1.5" fill="#c9a84c"/>
                </svg>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="form-input admin-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn admin-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading">
                  <span className="btn-spinner admin-spinner"></span>
                  Verifying...
                </span>
              ) : (
                "Login as Admin"
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link to="/StaffLogin" className="auth-link">
              Staff member? <strong>Go to Staff Login</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;