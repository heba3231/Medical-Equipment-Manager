// App.js - الكامل مع الروoutes الجديدة
import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row } from "reactstrap";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// imports
import Home from './Components/Home';
import Header from './Components/Header';
import Footer from './Components/Footer';
import StaffRegister from './Components/StaffRegister';
import StaffLogin from './Components/StaffLogin';
import DepartmentLists from './Components/DepartmentLists';
import DepartmentEquipment from './Components/DepartmentEquipment';
import AddDepartmentEquipment from './Components/AddDepartmentEquipment';
import EditDepartmentEquipment from './Components/EditDepartmentEquipment';
import AddNewDepartment from './Components/AddNewDepartment';
import AdminLogin from "./Components/AdminLogin";
import Config from "./Components/Config";
import AIInstrumentSearch from './Components/AIInstrumentSearch';
import EquipmentChecklist from './Components/EquipmentChecklist';
import OTDepartmentEnhanced from './Components/OTDepartmentEnhanced';

// ✅ OT Components
import OTDepartment from "./Components/OTDepartment";
import SurgerySets from "./Components/SurgerySets";
import SetEquipment from "./Components/SetEquipment";
import AddSetEquipment from "./Components/AddSetEquipment";
import EditSetEquipment from "./Components/EditSetEquipment";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const staff = localStorage.getItem("user");
    const admin = localStorage.getItem("admin");
    const role = localStorage.getItem("userRole");

    if (role === "admin" && admin) {
      setCurrentUser({ ...JSON.parse(admin), role: "admin" });
    } else if (role === "staff" && staff) {
      setCurrentUser({ ...JSON.parse(staff), role: "staff" });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userRole");
    setCurrentUser(null);
  };

  return (
    <Container fluid className="app-wrapper">
      <Router>
        <Header user={currentUser} onLogout={handleLogout} />
        <Row className="main-content">
          <Routes>
            {/* Home */}
            <Route
              path="/"
              element={currentUser ? <Home /> : <Navigate to="/StaffLogin" replace />}
            />

            {/* Login Pages */}
            <Route
              path="/StaffLogin"
              element={
                currentUser
                  ? <Navigate to="/" replace />
                  : <StaffLogin onLoginSuccess={(user) => setCurrentUser(user)} />
              }
            />
            <Route
              path="/AdminLogin"
              element={
                currentUser
                  ? <Navigate to="/" replace />
                  : <AdminLogin onLoginSuccess={(admin) => setCurrentUser(admin)} />
              }
            />
            <Route path="/StaffRegister" element={<StaffRegister />} />

            {/* Dynamic Department System - JUST 4 ROUTES FOR ALL 15+ DEPARTMENTS! */}
            <Route path="/department/:deptCode" element={<DepartmentLists />} />
            <Route path="/department/:deptCode/list/:listId" element={<DepartmentEquipment />} />
            <Route path="/department/:deptCode/list/:listId/add" element={<AddDepartmentEquipment />} />
            <Route path="/department/:deptCode/list/:listId/edit/:equipId" element={<EditDepartmentEquipment />} />

            {/* Add New Department */}
            <Route path="/AddNewDepartment" element={<AddNewDepartment />} />

            {/* ✅ OT Department Routes - 3 Levels */}
            <Route path="/ot" element={<OTDepartment />} />
            <Route path="/ot/surgery/:surgeryId" element={<SurgerySets />} />
            <Route path="/ot/set/:setId" element={<SetEquipment />} />
            <Route path="/ot/set/:setId/add" element={<AddSetEquipment />} />
            <Route path="/ot/set/:setId/edit/:equipId" element={<EditSetEquipment />} />

            {/* Config */}
            <Route path="/Config" element={<Config />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

            {/* AI Search Route */}
            <Route path="/ai-search" element={<AIInstrumentSearch />} />

            {/* ✅ Equipment Checklist Route - مباشر بدون Wrapper */}
            <Route path="/checklist/:deptCode/:listId" element={<EquipmentChecklist />} />

            {/* OT Department Enhanced Route */}
            <Route path="/ot-enhanced" element={<OTDepartmentEnhanced />} />
          </Routes>
        </Row>
        <Footer />
      </Router>
    </Container>
  );
}

export default App;