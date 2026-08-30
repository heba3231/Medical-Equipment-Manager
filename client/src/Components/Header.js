import { useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import logo from "../Images/logo.png";

const departments = [
  { name: "A/E", path: "/department/AE" },
  { name: "A.N.C", path: "/department/ANC" },
  { name: "E.N.T", path: "/department/ENT" },
  { name: "F.S.W", path: "/department/FSW" },
  { name: "F.M.W", path: "/department/FMW" },
  { name: "L.C.U", path: "/department/LCU" },
  { name: "MAT.B", path: "/department/MATB" },
  { name: "M.M.W", path: "/department/MMW" },
  { name: "M.OT", path: "/department/MOT" },
  { name: "M.S.W", path: "/department/MSW" },
  { name: "ORTH", path: "/department/ORTH" },
  { name: "PAED.A", path: "/department/PAEDA" },
  { name: "R.D.U", path: "/department/RDU" },
  { name: "S.OPD", path: "/department/SOPD" },
];

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [deptOpen, setDeptOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef(null);
  const menuRef = useRef(null);

  const handleLogout = () => {
    onLogout();
    navigate("/StaffLogin");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDeptOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target) && window.innerWidth <= 768) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="app-header">
      <div className="header-container">

        {/* Logo Section */}
        <div className="header-left" onClick={() => navigate(user ? "/" : "/StaffLogin")}>
          <div className="header-logo-wrap">
            <img
              src={logo}
              alt="MediTrack Logo"
              style={{
                width: "300px",
                height: "150px",
                borderRadius: "8px"
              }}
            />
          </div>
        </div>

        {/* Hamburger Menu (visible on mobile) */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "white",
            fontSize: "28px",
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          ☰
        </button>

        {/* Navigation */}
        <nav className={`header-nav ${menuOpen ? "mobile-open" : ""}`} ref={menuRef}>
          {/* Home Button */}
          {user && (
            <button
              className={`nav-btn ${isActive("/") ? "active" : ""}`}
              onClick={() => { navigate("/"); setMenuOpen(false); }}
            >
              Home
            </button>
          )}

          {/* Search Instrument Button */}
          {user && (
            <button
              className={`nav-btn ${location.pathname === "/ai-search" ? "active" : ""}`}
              onClick={() => { navigate("/ai-search"); setMenuOpen(false); }}
            >
               Search   Instrument
            </button>
          )}

          {/* OT Department Button */}
          {user && (
            <button
              className={`nav-btn ${location.pathname === "/ot-enhanced" ? "active" : ""}`}
              onClick={() => { navigate("/ot-enhanced"); setMenuOpen(false); }}
            >
               OT Department
            </button>
          )}

          {/* OT Dept Button (القديم) */}
          {user && (
            <button
              className={`nav-btn ${location.pathname.startsWith("/ot") && location.pathname !== "/ot-enhanced" ? "active" : ""}`}
              onClick={() => { navigate("/ot"); setMenuOpen(false); }}
            >
              OT Dept
            </button>
          )}

          {/* Departments Dropdown */}
          {user && (
            <div className="dept-dropdown-wrap" ref={dropRef}>
              <button
                className={`nav-btn dept-nav-btn ${location.pathname.startsWith("/department") ? "active" : ""}`}
                onClick={() => setDeptOpen((p) => !p)}
              >
                Departments
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    marginLeft: "5px",
                    transition: "transform 0.2s",
                    transform: deptOpen ? "rotate(180deg)" : "rotate(0deg)"
                  }}
                >
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {deptOpen && (
                <div className="dept-dropdown">
                  <div className="dept-dropdown-header">Select Department</div>
                  <div className="dept-dropdown-grid">
                    {departments.map((d, i) => (
                      <button
                        key={i}
                        className={`dept-dropdown-item ${location.pathname === d.path ? "dept-item-active" : ""}`}
                        onClick={() => { navigate(d.path); setDeptOpen(false); setMenuOpen(false); }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Button - للمدير فقط */}
          {user?.role === "admin" && (
            <button
              className={`nav-btn ${isActive("/reports") ? "active" : ""}`}
              onClick={() => { navigate("/reports"); setMenuOpen(false); }}
            >
               Reports
            </button>
          )}

          {/* Dashboard Button - للمدير فقط */}
          {user?.role === "admin" && (
            <button
              className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`}
              onClick={() => { navigate("/dashboard"); setMenuOpen(false); }}
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* User Actions */}
        <div className="header-actions">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-role-badge">
                  {user.role === "admin" ? "Admin" : "Staff"}
                </span>
                <span className="user-name">{user.name || user.role}</span>
              </div>
              <button className="header-btn logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="header-btn login-btn" onClick={() => navigate("/StaffLogin")}>
                Login
              </button>
              <button className="header-btn admin-login-btn" onClick={() => navigate("/AdminLogin")}>
                Admin Login
              </button>
            </>
          )}
        </div>

      </div>

      <style>{`
        /* إظهار زر الهامبرغر على الشاشات الصغيرة */
        @media (max-width: 768px) {
          .hamburger-btn {
            display: block !important;
          }
          .header-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #006341;
            flex-direction: column;
            align-items: stretch;
            padding: 16px;
            gap: 6px;
            border-top: 2px solid #c9a84c;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            transform: scaleY(0);
            transform-origin: top;
            transition: transform 0.25s ease;
            pointer-events: none;
            border-radius: 0 0 12px 12px;
            z-index: 999;
          }
          .header-nav.mobile-open {
            transform: scaleY(1);
            pointer-events: auto;
          }
          .header-nav .nav-btn {
            width: 100%;
            justify-content: center;
            padding: 10px;
            font-size: 15px;
            border-radius: 8px;
          }
          .header-nav .dept-dropdown-wrap {
            width: 100%;
          }
          .header-nav .dept-dropdown-wrap .dept-nav-btn {
            width: 100%;
            justify-content: center;
          }
          .dept-dropdown {
            position: static !important;
            transform: none !important;
            width: 100% !important;
            min-width: auto !important;
            margin-top: 6px;
            box-shadow: none;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(4px);
          }
          .dept-dropdown .dept-dropdown-header {
            color: #c9a84c;
            border-bottom-color: rgba(255,255,255,0.15);
          }
          .dept-dropdown .dept-dropdown-item {
            background: rgba(255,255,255,0.06);
            color: #fff;
            border-color: rgba(255,255,255,0.1);
          }
          .dept-dropdown .dept-dropdown-item:hover {
            background: #c9a84c;
            color: #004d32;
          }
          .dept-dropdown .dept-item-active {
            background: #c9a84c;
            color: #004d32;
          }
          .header-actions {
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
          }
          .user-info .user-name {
            font-size: 12px;
          }
          .header-btn {
            padding: 5px 12px;
            font-size: 12px;
          }
        }

        /* تحسينات إضافية للشاشات الصغيرة جداً */
        @media (max-width: 480px) {
          .header-container {
            padding: 0 10px;
          }
          .header-left img {
            width: 180px !important;
            height: 90px !important;
          }
          .header-actions .user-info {
            padding: 3px 8px;
          }
          .header-actions .user-role-badge {
            font-size: 8px;
            padding: 1px 5px;
          }
          .header-actions .user-name {
            font-size: 11px;
          }
          .header-btn {
            font-size: 11px;
            padding: 4px 10px;
          }
          .header-nav .nav-btn {
            font-size: 13px;
            padding: 8px;
          }
        }

        /* تحسين مظهر الهامبرغر على الشاشات الكبيرة (يختفي) */
        @media (min-width: 769px) {
          .hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;