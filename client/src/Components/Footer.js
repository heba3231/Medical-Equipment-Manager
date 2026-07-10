import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  // إخفاء زر Admin Login لو المستخدم أصلاً في صفحة AdminLogin
  const isAdminLoginPage = location.pathname === '/AdminLogin';

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-copyright">
          © {currentYear} MediTrack - Medical Equipment Tracking System
        </div>
        <div className="footer-links">
          <span className="footer-stat">
            📊 All Departments Active
          </span>
        </div>
        {!isAdminLoginPage && (
          <div className="footer-admin-section">
            <button
              className="footer-admin-btn"
              onClick={() => navigate('/AdminLogin')}
            >
              👑 Admin Login
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;