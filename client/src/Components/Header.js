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
  const dropRef = useRef(null);

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
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

        {/* Navigation */}
        <nav className="header-nav">
          {/* Home Button */}
          {user && (
            <button
              className={`nav-btn ${isActive("/") ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              Home
            </button>
          )}

          {/* Search Instrument Button - نفس ستايل الأزرار */}
          {user && (
            <button
              className={`nav-btn ${location.pathname === "/ai-search" ? "active" : ""}`}
              onClick={() => navigate("/ai-search")}
            >
              🔍 Search Instrument
            </button>
          )}

          {/* OT Department Button - نفس ستايل الأزرار */}
          {user && (
            <button
              className={`nav-btn ${location.pathname === "/ot-enhanced" ? "active" : ""}`}
              onClick={() => navigate("/ot-enhanced")}
            >
              🏥 OT Department
            </button>
          )}

          {/* OT Dept Button (القديم) */}
          {user && (
            <button
              className={`nav-btn ${location.pathname.startsWith("/ot") && location.pathname !== "/ot-enhanced" ? "active" : ""}`}
              onClick={() => navigate("/ot")}
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
                        onClick={() => { navigate(d.path); setDeptOpen(false); }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Button - للمدير فقط */}
          {user?.role === "admin" && (
            <button
              className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`}
              onClick={() => navigate("/dashboard")}
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
    </header>
  );
}

export default Header;