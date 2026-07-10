// Components/OTDepartment.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

function OTDepartment() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  // ========== CHECK FOR SIMPLE VIEW (QR SCAN) ==========
  const queryParams = new URLSearchParams(location.search);
  const isSimpleView = queryParams.get("view") === "simple";
  const qrDeptCode = queryParams.get("deptCode");
  const qrListId = queryParams.get("listId");

  // ========== STATE ==========
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newDept, setNewDept] = useState({ name: "", description: "" });
  const [editingDeptId, setEditingDeptId] = useState(null);

  const [lists, setLists] = useState({});
  const [newList, setNewList] = useState({ name: "", description: "" });
  const [editingListId, setEditingListId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(qrDeptCode || null);
  const [selectedListId, setSelectedListId] = useState(qrListId || null);

  const [equipment, setEquipment] = useState({});
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    code: "",
    quantity: 1,
    image: null
  });
  const [editingEquipId, setEditingEquipId] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageModal, setImageModal] = useState(null);

  // ========== SEARCH & SORT STATE ==========
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // ========== QR CODE STATE ==========
  const [showQRModal, setShowQRModal] = useState(false);
  const [serverIP, setServerIP] = useState(window.location.hostname);

  // ========== CHECK (Checklist) STATE ==========
  const [checkMode, setCheckMode] = useState(false);
  const [checkData, setCheckData] = useState({});
  const [checkMeta, setCheckMeta] = useState({ technician: "", startedAt: null });
  const [checkListImage, setCheckListImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ========== SVG ICONS ==========
  const Icons = {
    hospital: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
        <path d="M9 3v4M15 3v4M9 11h2M13 11h2M9 15h2M13 15h2" />
      </svg>
    ),
    list: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    equipment: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    add: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    edit: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    delete: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
    cancel: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    camera: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    upload: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    imagePlaceholder: () => (
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    loading: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    admin: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    staff: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    qty: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
    search: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    empty: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    eye: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    back: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    bell: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    chevronDown: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    barcode: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 5v14M7 5v14M11 5v10M15 5v14M19 5v10M21 5v14" />
      </svg>
    ),
    calendar: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    wrench: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    checkCircle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    warnTriangle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    questionCircle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 2-3 4" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    printer: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    sendCheck: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    zoomIn: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    close: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  };

  // ========== DEFAULT DEPARTMENTS ==========
  const defaultDepartments = [
    { id: "dept_women", name: "Women & Maternity", description: "Obstetrics and Gynecology Department" },
    { id: "dept_surgery", name: "General Surgery", description: "General Surgery Department" },
    { id: "dept_ortho", name: "Orthopedics", description: "Orthopedic Surgery Department" },
    { id: "dept_ent", name: "E.N.T", description: "Ear, Nose and Throat Department" },
    { id: "dept_cardiac", name: "Cardiac Surgery", description: "Cardiac Surgery Department" },
    { id: "dept_pediatric", name: "Pediatric Surgery", description: "Pediatric Surgery Department" },
  ];

  // ========== GET SERVER IP FOR QR ==========
  useEffect(() => {
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      setServerIP('192.168.8.93');
    } else {
      setServerIP(currentHostname);
    }
  }, []);

  // ========== LOAD DATA ==========
  useEffect(() => {
    loadDepartments();
  }, []);

  // ========== If QR scan, auto-select the list ==========
  useEffect(() => {
    if (qrListId && qrDeptCode) {
      setSelectedDeptId(qrDeptCode);
      setSelectedListId(qrListId);
      fetchEquipmentForList(qrListId);
    }
  }, [qrListId, qrDeptCode]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const savedDepts = localStorage.getItem("ot_departments");
      let depts;

      if (savedDepts) {
        depts = JSON.parse(savedDepts);
        setDepartments(depts);
      } else {
        depts = defaultDepartments;
        setDepartments(defaultDepartments);
        localStorage.setItem("ot_departments", JSON.stringify(defaultDepartments));
      }

      for (const dept of depts) {
        await fetchLists(dept.id);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setDepartments(defaultDepartments);
      localStorage.setItem("ot_departments", JSON.stringify(defaultDepartments));
      for (const dept of defaultDepartments) {
        await fetchLists(dept.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async (deptId) => {
    try {
      const response = await fetch(`${API_BASE}/ot-custom-lists?deptCode=${deptId}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setLists(prev => ({ ...prev, [deptId]: data.data }));
        for (const list of data.data) {
          await fetchEquipment(list.id);
        }
      } else {
        const defaultList = {
          id: `list_${Date.now()}_${deptId}`,
          name: "Basic Equipment",
          description: "Basic Equipment List",
          deptCode: deptId,
          equipment: []
        };
        await createDefaultList(defaultList);
      }
    } catch (err) {
      console.error("Error fetching lists for", deptId, ":", err);
    }
  };

  const createDefaultList = async (listData) => {
    try {
      const response = await fetch(`${API_BASE}/ot-custom-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData)
      });
      const data = await response.json();
      if (data.success) {
        setLists(prev => ({
          ...prev,
          [listData.deptCode]: [...(prev[listData.deptCode] || []), data.data]
        }));
        await fetchEquipment(listData.id);
      }
    } catch (err) {
      console.error("Error creating default list:", err);
    }
  };

  const fetchEquipment = async (listId) => {
    try {
      const response = await fetch(`${API_BASE}/ot-custom-equipment/${listId}`);
      const data = await response.json();
      if (data.success) {
        setEquipment(prev => ({ ...prev, [listId]: data.data }));
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
    }
  };

  const fetchEquipmentForList = async (listId) => {
    try {
      const response = await fetch(`${API_BASE}/ot-custom-equipment/${listId}`);
      const data = await response.json();
      if (data.success) {
        setEquipment(prev => ({ ...prev, [listId]: data.data }));
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
    }
  };

  // ========== DEPARTMENT CRUD ==========
  const handleAddDept = () => {
    if (!newDept.name.trim()) return alert("Please enter department name");

    const newDeptObj = {
      id: `dept_${Date.now()}`,
      name: newDept.name.trim(),
      description: newDept.description.trim() || ""
    };

    let updatedDepts;
    if (editingDeptId) {
      updatedDepts = departments.map(d =>
        d.id === editingDeptId ? { ...d, ...newDeptObj } : d
      );
      setEditingDeptId(null);
    } else {
      updatedDepts = [...departments, newDeptObj];
      const defaultList = {
        id: `list_${Date.now()}_${newDeptObj.id}`,
        name: "Basic Equipment",
        description: "Basic Equipment List",
        deptCode: newDeptObj.id,
        equipment: []
      };
      createDefaultList(defaultList);
    }

    setDepartments(updatedDepts);
    localStorage.setItem("ot_departments", JSON.stringify(updatedDepts));
    setNewDept({ name: "", description: "" });
  };

  const handleEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setNewDept({ name: dept.name, description: dept.description || "" });
  };

  const handleDeleteDept = (id, name) => {
    if (!window.confirm(`Delete department "${name}"? All lists and equipment will be deleted!`)) return;

    const updatedDepts = departments.filter(d => d.id !== id);
    setDepartments(updatedDepts);
    localStorage.setItem("ot_departments", JSON.stringify(updatedDepts));
    setLists(prev => { const newState = { ...prev }; delete newState[id]; return newState; });

    if (selectedDeptId === id) setSelectedDeptId(null);
    if (selectedListId && lists[id]?.find(l => l.id === selectedListId)) setSelectedListId(null);
  };

  // ========== LIST CRUD ==========
  const handleAddList = async () => {
    if (!newList.name.trim()) return alert("Please enter list name");
    if (!selectedDeptId) return alert("Please select a department first");

    setSaving(true);
    try {
      const listData = {
        id: `list_${Date.now()}`,
        name: newList.name.trim(),
        description: newList.description.trim() || "",
        deptCode: selectedDeptId,
        roomId: null,
        createdBy: localStorage.getItem("userName") || "Admin"
      };

      let response;
      if (editingListId) {
        response = await fetch(`${API_BASE}/ot-custom-lists/${editingListId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listData)
        });
      } else {
        response = await fetch(`${API_BASE}/ot-custom-lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listData)
        });
      }

      const data = await response.json();
      if (data.success) {
        await fetchLists(selectedDeptId);
        setNewList({ name: "", description: "" });
        setEditingListId(null);
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error saving list: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditList = (list) => {
    setEditingListId(list.id);
    setNewList({ name: list.name, description: list.description || "" });
  };

  const handleDeleteList = async (listId, name) => {
    if (!window.confirm(`Delete list "${name}"? All equipment will be deleted!`)) return;

    try {
      const response = await fetch(`${API_BASE}/ot-custom-lists/${listId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setLists(prev => ({
          ...prev,
          [selectedDeptId]: (prev[selectedDeptId] || []).filter(l => l.id !== listId)
        }));
        setEquipment(prev => { const newState = { ...prev }; delete newState[listId]; return newState; });
        if (selectedListId === listId) setSelectedListId(null);
      }
    } catch (err) {
      alert("Error deleting list: " + err.message);
    }
  };

  // ========== EQUIPMENT CRUD ==========
  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim() || !newEquipment.code.trim()) {
      return alert("Please enter equipment name and code");
    }
    if (!selectedListId) return alert("Please select a list first");

    setSaving(true);
    try {
      const equipData = {
        id: `eq_${Date.now()}`,
        listId: selectedListId,
        name: newEquipment.name.trim(),
        code: newEquipment.code.trim(),
        quantity: parseInt(newEquipment.quantity) || 1,
        image: newEquipment.image || null
      };

      let response;
      if (editingEquipId) {
        response = await fetch(`${API_BASE}/ot-custom-equipment/${editingEquipId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(equipData)
        });
      } else {
        response = await fetch(`${API_BASE}/ot-custom-equipment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(equipData)
        });
      }

      const data = await response.json();
      if (data.success) {
        await fetchEquipment(selectedListId);
        resetEquipmentForm();
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error saving equipment: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditEquipment = (item) => {
    setEditingEquipId(item.id);
    setNewEquipment({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      image: item.image || null
    });
    setImagePreview(item.image || null);
  };

  const handleDeleteEquipment = async (id, name) => {
    if (!window.confirm(`Delete equipment "${name}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/ot-custom-equipment/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        await fetchEquipment(selectedListId);
      }
    } catch (err) {
      alert("Error deleting equipment: " + err.message);
    }
  };

  const resetEquipmentForm = () => {
    setNewEquipment({ name: "", code: "", quantity: 1, image: null });
    setImagePreview(null);
    setEditingEquipId(null);
  };

  // ========== IMAGE HANDLING ==========
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Image too large! Maximum 5MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setNewEquipment(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { alert("Image too large! Maximum 5MB"); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setNewEquipment(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // ========== QR CODE URL ==========
  const getQRUrl = () => {
    const currentPort = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${serverIP}${currentPort}${window.location.pathname}?view=simple&deptCode=${selectedDeptId}&listId=${selectedListId}`;
  };

  // ========== COMPUTED VALUES ==========
  const currentLists = selectedDeptId ? lists[selectedDeptId] || [] : [];
  const currentEquipment = selectedListId ? equipment[selectedListId] || [] : [];
  const selectedListObj = currentLists.find(l => l.id === selectedListId) || null;
  const selectedListName = selectedListObj?.name || "";
  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name || "";

  // ========== SEARCH & SORT LOGIC ==========
  const filteredAndSortedEquipment = useMemo(() => {
    let result = [...currentEquipment];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term)
      );
    }

    switch(sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'quantity':
        result.sort((a, b) => a.quantity - b.quantity);
        break;
      default:
        break;
    }

    return result;
  }, [currentEquipment, searchTerm, sortBy]);

  // ========== CHECK (Checklist) LOGIC ==========
  const startCheck = () => {
    if (!selectedListId) return alert("Please select a list first");
    const initial = {};
    currentEquipment.forEach(item => {
      initial[item.id] = {
        present: item.quantity,
        damaged: false,
        note: ""
      };
    });
    setCheckData(initial);
    
    const userName = localStorage.getItem("userName") || 
                     localStorage.getItem("adminName") || 
                     "Technician";
    
    setCheckMeta({
      technician: userName,
      startedAt: new Date()
    });
    setCheckListImage(selectedListObj?.image || null);
    setCheckMode(true);
  };

  const updateCheckPresent = (itemId, delta, maxQty) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, note: "" };
      const nextPresent = Math.max(0, Math.min(maxQty, current.present + delta));
      return { ...prev, [itemId]: { ...current, present: nextPresent } };
    });
  };

  const toggleCheckDamaged = (itemId) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, note: "" };
      return { ...prev, [itemId]: { ...current, damaged: !current.damaged } };
    });
  };

  const updateCheckNote = (itemId, note) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, note: "" };
      return { ...prev, [itemId]: { ...current, note } };
    });
  };

  const getItemStatus = (item) => {
    const data = checkData[item.id] || { present: item.quantity, damaged: false };
    if (data.damaged) return "damaged";
    if (data.present >= item.quantity) return "ok";
    return "missing";
  };

  const checkStats = useMemo(() => {
    let totalRequired = 0;
    let totalPresent = 0;
    let okCount = 0;
    let missingCount = 0;
    let damagedCount = 0;
    let undeterminedCount = 0;

    currentEquipment.forEach(item => {
      totalRequired += item.quantity || 0;
      const data = checkData[item.id];
      if (!data) {
        undeterminedCount += 1;
        return;
      }
      totalPresent += data.present || 0;
      if (data.damaged) damagedCount += 1;
      else if (data.present >= item.quantity) okCount += 1;
      else missingCount += 1;
    });

    const percentage = totalRequired > 0 ? Math.round((totalPresent / totalRequired) * 100) : 0;

    return { totalRequired, totalPresent, okCount, missingCount, damagedCount, undeterminedCount, percentage };
  }, [currentEquipment, checkData]);

  const handleApproveAndSend = () => {
    alert(`✅ Checklist approved and sent to operations\nCheck percentage: ${checkStats.percentage}%\nPresent: ${checkStats.okCount}\nMissing: ${checkStats.missingCount}\nDamaged: ${checkStats.damagedCount}`);
    setCheckMode(false);
  };

  const handleReportShortage = () => {
    alert("📢 Shortage notification sent to room administrator");
  };

  // ===== Upload set image from check page =====
  const handleCheckListImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("⚠️ Image too large! Maximum 5MB"); 
        return; 
      }
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        setCheckListImage(imageData);
        
        try {
          const listData = {
            name: selectedListObj?.name || "",
            description: selectedListObj?.description || "",
            image: imageData,
            deptCode: selectedDeptId,
            roomId: null
          };
          
          const response = await fetch(`${API_BASE}/ot-custom-lists/${selectedListId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(listData)
          });
          
          const result = await response.json();
          if (result.success) {
            setLists(prev => {
              const updatedLists = { ...prev };
              if (updatedLists[selectedDeptId]) {
                updatedLists[selectedDeptId] = updatedLists[selectedDeptId].map(list => 
                  list.id === selectedListId ? { ...list, image: imageData } : list
                );
              }
              return updatedLists;
            });
          } else {
            alert("❌ Failed to save image: " + (result.message || "Unknown error"));
            setCheckListImage(null);
          }
        } catch (err) {
          alert("❌ Error saving image: " + err.message);
          setCheckListImage(null);
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckListRemoveImage = async () => {
    if (!window.confirm("Remove set image?")) return;
    
    setCheckListImage(null);
    try {
      const listData = {
        name: selectedListObj?.name || "",
        description: selectedListObj?.description || "",
        image: null,
        deptCode: selectedDeptId,
        roomId: null
      };
      
      const response = await fetch(`${API_BASE}/ot-custom-lists/${selectedListId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData)
      });
      
      const result = await response.json();
      if (result.success) {
        setLists(prev => {
          const updatedLists = { ...prev };
          if (updatedLists[selectedDeptId]) {
            updatedLists[selectedDeptId] = updatedLists[selectedDeptId].map(list => 
              list.id === selectedListId ? { ...list, image: null } : list
            );
          }
          return updatedLists;
        });
        alert("✅ Image removed successfully");
      }
    } catch (err) {
      alert("❌ Error removing image: " + err.message);
    }
  };

  // ========== PAPER-STYLE TABLE CELL STYLES ==========
  const equipThStyle = {
    padding: "10px 8px",
    border: "2px solid #000000",
    fontSize: "11px",
    color: "#000000",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  };
  const equipTdStyle = {
    padding: "9px 8px",
    border: "2px solid #000000",
    verticalAlign: "middle",
    color: "#000000"
  };

  // ============================================================
  // 🟣 CHECK MODE - Displays when "Start Checklist" is clicked
  // ============================================================
  if (checkMode) {
    const checkThStyle = {
      padding: "12px 10px",
      background: "#f8fafb",
      borderBottom: "2px solid #e5e7eb",
      fontSize: "12px",
      color: "#6b7280",
      fontWeight: "700",
      textAlign: "left"
    };
    const checkTdStyle = {
      padding: "12px 10px",
      borderBottom: "1px solid #eef0f2",
      verticalAlign: "middle",
      fontSize: "13px"
    };

    return (
      <div style={{
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        background: "#eef1f0",
        minHeight: "100vh"
      }}>
        {/* ===== TOP BAR ===== */}
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }} className="no-print">
          <button
            onClick={() => setCheckMode(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <Icons.back />
            Back
          </button>

          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", margin: 0 }}>
            Checking {selectedListName || "Instrument Set"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ position: "relative", color: "#374151" }}>
              <Icons.bell />
              <span style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#dc2626",
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                borderRadius: "999px",
                padding: "1px 5px",
                lineHeight: "12px"
              }}>3</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "#004d32",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px"
              }}>
                {(checkMeta.technician || "T").charAt(0)}
              </div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                {checkMeta.technician || "Technician"}
              </span>
              <Icons.chevronDown />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "22px 24px 120px" }}>

          {/* ===== SET INFO CARD ===== */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "20px"
          }} className="no-print">
            {/* Set image - only visible on screen, hidden in print */}
            <div style={{
              width: "150px",
              height: "110px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#f3f4f6",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "2px dashed #d0e8dc",
              cursor: checkListImage ? "pointer" : "default"
            }}
            className="no-print"
            onClick={() => {
              if (checkListImage) {
                setImageModal(checkListImage);
              }
            }}>
              {checkListImage ? (
                <>
                  <img 
                    src={checkListImage} 
                    alt={selectedListName} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      console.warn('⚠️ Failed to load set image');
                      e.target.style.display = 'none';
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "50%",
                    padding: "8px",
                    opacity: 0,
                    transition: "opacity 0.3s",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                    <Icons.zoomIn />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCheckListRemoveImage(); }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Remove image"
                    className="no-print"
                  >
                    ✕
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); document.getElementById('checkImageInput').click(); }}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "#004d32",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Change image"
                    className="no-print"
                  >
                    <Icons.camera />
                  </button>
                </>
              ) : (
                <>
                  <Icons.imagePlaceholder />
                  <span style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }} className="no-print">Click to add image</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); document.getElementById('checkImageInput').click(); }}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "#004d32",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Add image"
                    className="no-print"
                  >
                    <Icons.add />
                  </button>
                </>
              )}
              <input
                id="checkImageInput"
                type="file"
                accept="image/*"
                onChange={handleCheckListImageUpload}
                style={{ display: "none" }}
              />
              {isUploadingImage && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px"
                }} className="no-print">
                  ⏳ Uploading...
                </div>
              )}
            </div>

            {/* Name + code */}
            <div style={{ minWidth: "180px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "19px", fontWeight: "700", color: "#1f2937" }}>
                  {selectedListName || "Equipment Set"}
                </span>
                <span style={{
                  background: "#e6f0ec",
                  color: "#065f46",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "6px"
                }}>
                  {(selectedListId || "SET-000").toString().slice(-7).toUpperCase()}
                </span>
                <Icons.barcode />
              </div>
            </div>

            {/* Meta grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, auto)",
              gap: "26px",
              flex: 1,
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.eye /> Department
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>{selectedDeptName || "—"}</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.wrench /> Total Items
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>{currentEquipment.length} items</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.staff /> Technician
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>
                  {checkMeta.technician || "Technician"}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.calendar /> Date & Time
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>
                  {(checkMeta.startedAt || new Date()).toLocaleDateString('en-CA')}{"  "}
                  {(checkMeta.startedAt || new Date()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Percentage ring */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                background: `conic-gradient(#16a34a ${checkStats.percentage * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#1f2937" }}>
                    {checkStats.totalPresent}/{checkStats.totalRequired}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>
                    ({checkStats.percentage}%)
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>Check Percentage</span>
            </div>
          </div>

          {/* ===== CHECK TABLE ===== */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            overflow: "hidden"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...checkThStyle, textAlign: "center", width: "40px" }}>#</th>
                    <th style={checkThStyle}>Item Name</th>
                    <th style={{ ...checkThStyle, textAlign: "center", width: "70px" }}>Image</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Required</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Available</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Status</th>
                    <th style={checkThStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEquipment.map((item, idx) => {
                    const data = checkData[item.id] || { present: item.quantity, damaged: false, note: "" };
                    const status = getItemStatus(item);
                    const rowBg = status === "missing" ? "#fdf2f2" : status === "damaged" ? "#fff7ed" : "#ffffff";

                    return (
                      <tr key={item.id} style={{ background: rowBg }}>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#004d32",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "700",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>{idx + 1}</span>
                        </td>
                        <td style={{ ...checkTdStyle, fontWeight: "600", color: "#1f2937" }}>{item.name}</td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          {/* ✅ صورة الأداة - تظهر على الشاشة فقط، تختفي عند الطباعة */}
                          <span className="no-print">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                onClick={() => setImageModal(item.image)}
                                style={{ width: "34px", height: "34px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", border: "1px solid #e5e7eb" }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<span style="color:#d1d5db;font-size:20px;">📷</span>`;
                                }}
                              />
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: "20px" }}>📷</span>
                            )}
                          </span>
                          {/* ✅ للطباعة - يظهر علامة (✓) بدلاً من الصورة */}
                          <span className="print-only" style={{ display: "none", fontSize: "18px", color: "#004d32" }}>
                            ✓
                          </span>
                        </td>
                        <td style={{ ...checkTdStyle, textAlign: "center", fontWeight: "700", color: "#374151" }}>{item.quantity}</td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => updateCheckPresent(item.id, -1, item.quantity)}
                              style={{
                                width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #d0e8dc",
                                background: "#f8fafb", cursor: "pointer", fontWeight: "700", color: "#374151"
                              }}
                              className="no-print"
                            >−</button>
                            <span style={{
                              minWidth: "28px",
                              textAlign: "center",
                              fontWeight: "800",
                              color: status === "missing" ? "#dc2626" : "#1f2937"
                            }}>
                              {data.present}
                            </span>
                            <button
                              onClick={() => updateCheckPresent(item.id, 1, item.quantity)}
                              style={{
                                width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #d0e8dc",
                                background: "#f8fafb", cursor: "pointer", fontWeight: "700", color: "#374151"
                              }}
                              className="no-print"
                            >+</button>
                          </div>
                        </td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          {status === "ok" && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "700",
                              padding: "4px 10px", borderRadius: "999px"
                            }}>
                              <Icons.checkCircle /> Present
                            </span>
                          )}
                          {status === "missing" && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              background: "#fee2e2", color: "#b91c1c", fontSize: "11px", fontWeight: "700",
                              padding: "4px 10px", borderRadius: "999px"
                            }}>
                              <Icons.warnTriangle /> Missing ({item.quantity - data.present})
                            </span>
                          )}
                          {status === "damaged" && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              background: "#ffedd5", color: "#9a3412", fontSize: "11px", fontWeight: "700",
                              padding: "4px 10px", borderRadius: "999px"
                            }}>
                              <Icons.wrench /> Damaged
                            </span>
                          )}
                          <div>
                            <button
                              onClick={() => toggleCheckDamaged(item.id)}
                              style={{
                                marginTop: "6px",
                                background: "none",
                                border: "none",
                                color: "#6b7280",
                                fontSize: "10px",
                                cursor: "pointer",
                                textDecoration: "underline"
                              }}
                              className="no-print"
                            >
                              {status === "damaged" ? "Cancel damaged" : "Mark as damaged"}
                            </button>
                          </div>
                        </td>
                        <td style={checkTdStyle}>
                          <input
                            type="text"
                            placeholder="Notes..."
                            value={data.note}
                            onChange={(e) => updateCheckNote(item.id, e.target.value)}
                            style={{
                              width: "100%",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              fontSize: "12px",
                              outline: "none"
                            }}
                            className="no-print"
                          />
                          {/* ✅ للطباعة - عرض الملاحظات كنص */}
                          <span className="print-only" style={{ display: "none", fontSize: "12px", color: "#1f2937" }}>
                            {data.note || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {currentEquipment.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#9ca3af" }}>
                        No equipment found in this list
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== FIXED BOTTOM BAR ===== */}
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)"
        }} className="no-print">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", background: "#f0fdf4", borderRadius: "10px", padding: "8px 18px", minWidth: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#16a34a", fontSize: "11px", fontWeight: "700" }}>
                <Icons.checkCircle /> Present
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>{checkStats.okCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#fef2f2", borderRadius: "10px", padding: "8px 18px", minWidth: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#d97706", fontSize: "11px", fontWeight: "700" }}>
                <Icons.warnTriangle /> Missing
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#b91c1c" }}>{checkStats.missingCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#fff7ed", borderRadius: "10px", padding: "8px 18px", minWidth: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#c2410c", fontSize: "11px", fontWeight: "700" }}>
                <Icons.wrench /> Damaged
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#9a3412" }}>{checkStats.damagedCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#f9fafb", borderRadius: "10px", padding: "8px 18px", minWidth: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#9ca3af", fontSize: "11px", fontWeight: "700" }}>
                <Icons.questionCircle /> Undetermined
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#6b7280" }}>{checkStats.undeterminedCount}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", borderRadius: "10px",
                border: "1.5px solid #004d32", background: "white", color: "#004d32",
                fontWeight: "700", fontSize: "13px", cursor: "pointer"
              }}
            >
              <Icons.printer /> Print List
            </button>
            <button
              onClick={handleApproveAndSend}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", borderRadius: "10px",
                border: "none", background: "#004d32", color: "white",
                fontWeight: "700", fontSize: "13px", cursor: "pointer"
              }}
            >
              <Icons.sendCheck /> Approve & Send
            </button>
            <button
              onClick={handleReportShortage}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", borderRadius: "10px",
                border: "none", background: "#dc2626", color: "white",
                fontWeight: "700", fontSize: "13px", cursor: "pointer"
              }}
            >
              <Icons.bell /> Report Shortage
            </button>
          </div>
        </div>

        {/* CSS for print - hide images, show checkmarks, hide header and footer */}
        <style>{`
          @media print {
            /* Hide all elements with .no-print class */
            .no-print {
              display: none !important;
            }
            /* Show elements with .print-only class */
            .print-only {
              display: inline !important;
            }
            body {
              background: #ffffff !important;
            }
            .ot-print-sheet {
              box-shadow: none !important;
              border: none !important;
            }
            /* Keep table borders for print */
            table {
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #000 !important;
            }
            /* Remove page header and footer */
            @page {
              margin: 0.5in;
              size: portrait;
            }
            /* Hide header and footer areas */
            .print-header,
            .print-footer {
              display: none !important;
            }
            /* Ensure the table takes full width */
            table {
              width: 100% !important;
            }
          }
          /* Screen only - hide print-only elements */
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}</style>

        {/* Image Modal - for zooming in */}
        {imageModal && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, cursor: 'pointer'
            }}
            className="no-print"
            onClick={() => setImageModal(null)}
          >
            <button
              onClick={() => setImageModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '30px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              <Icons.close />
            </button>
            <img 
              src={imageModal} 
              alt="Zoomed view" 
              style={{ 
                maxWidth: '90%', 
                maxHeight: '90%', 
                borderRadius: '8px',
                objectFit: 'contain'
              }} 
            />
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 🟢 SIMPLE VIEW - Displays when QR code is scanned
  // ============================================================
  if (isSimpleView && qrListId) {
    const simpleEquipment = equipment[qrListId] || [];

    const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const printTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const thStyle = {
      padding: '10px 8px',
      border: '1px solid #cfe3d8',
      fontSize: '11px',
      color: '#004d32',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.4px'
    };
    const tdStyle = {
      padding: '9px 8px',
      border: '1px solid #e5e7eb',
      verticalAlign: 'middle'
    };

    return (
      <div style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: '#eef1f0',
        minHeight: '100vh',
        padding: '18px 12px'
      }}>
        {/* CSS للطباعة */}
        <style>{`
          @media print {
            body { background: #ffffff !important; }
            .ot-no-print { display: none !important; }
            .ot-print-sheet { box-shadow: none !important; border: none !important; }
            /* ✅ إخفاء عمود الصورة بالكامل عند الطباعة */
            .image-column {
              display: none !important;
            }
            /* ✅ إخفاء الفوتر */
            .footer-print-hide {
              display: none !important;
            }
            /* ✅ إخفاء خانات التوقيع */
            .signature-print-hide {
              display: none !important;
            }
            /* ✅ إخفاء الهيدر */
            .header-print-hide {
              display: none !important;
            }
            /* ✅ إخفاء صف القسم */
            .dept-row-print-hide {
              display: none !important;
            }
          }
        `}</style>

        <div className="ot-print-sheet" style={{
          maxWidth: '860px',
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #d7e3dc',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>

          {/* ===== الهيدر الأخضر - يختفي عند الطباعة ===== */}
          <div className="header-print-hide" style={{
            background: '#006341',
            padding: '16px 26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '4px solid #c9a84c'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
                <path d="M9 3v4M15 3v4M9 11h2M13 11h2M9 15h2M13 15h2" />
              </svg>
              <div>
                <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', letterSpacing: '0.4px', lineHeight: 1.2 }}>
                  OPERATING THEATER DEPARTMENT
                </div>
                <div style={{ color: '#d9ecdf', fontSize: '11px', letterSpacing: '0.4px', marginTop: '2px' }}>
                  Instrument &amp; Equipment Inventory Sheet
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#eafaf0', fontSize: '11px', lineHeight: 1.5 }}>
              <div>Date: {printDate}</div>
              <div>Time: {printTime}</div>
            </div>
          </div>

          {/* ===== صف القسم / القائمة - يختفي عند الطباعة ===== */}
          <div className="dept-row-print-hide" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{ padding: '14px 26px', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Department
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#004d32', marginTop: '2px' }}>
                {selectedDeptName || "—"}
              </div>
            </div>
            <div style={{ padding: '14px 26px' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Instrument Set / List
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#004d32', marginTop: '2px' }}>
                {selectedListName || "Equipment List"}
              </div>
            </div>
          </div>

          {/* ===== الجدول ===== */}
          <div style={{ padding: '22px 26px 10px' }}>
            {simpleEquipment.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9ca3af' }}>
                <p>No equipment found in this list.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#eef5f1' }}>
                    <th style={{ ...thStyle, width: '34px', textAlign: 'center' }}>No.</th>
                    {/* ✅ عمود الصورة - يختفي عند الطباعة */}
                    <th className="image-column" style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Image</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Item Description</th>
                    <th style={{ ...thStyle, width: '110px', textAlign: 'left' }}>Code</th>
                    <th style={{ ...thStyle, width: '56px', textAlign: 'center' }}>Qty</th>
                    <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {simpleEquipment.map((item, idx) => (
                    <tr key={item.id || item._id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafcfb' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>{idx + 1}</td>
                      {/* ✅ عمود الصورة - يختفي عند الطباعة */}
                      <td className="image-column" style={{ ...tdStyle, textAlign: 'center' }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid #e5e7eb'
                            }}
                            onClick={() => setImageModal(item.image)}
                            alt={item.name}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '15px',
                            border: '1px solid #e5e7eb',
                            margin: '0 auto'
                          }}>
                            📷
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: '#1f2937' }}>{item.name}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#4b5563' }}>{item.code || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: '#004d32' }}>{item.quantity || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#c8cdd3', fontSize: '15px' }}>☐</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ===== خانات التوقيع - تختفي عند الطباعة ===== */}
          <div className="signature-print-hide" style={{
            borderTop: '2px solid #e5e7eb',
            padding: '20px 26px 26px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '30px', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Checked By
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Signature &amp; Date
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '30px', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Verified By
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Signature &amp; Date
              </div>
            </div>
          </div>

          {/* ===== الفوتر السفلي - يختفي عند الطباعة ===== */}
          <div className="footer-print-hide" style={{
            textAlign: 'center',
            padding: '10px',
            background: '#f8fafb',
            borderTop: '1px solid #e5e7eb',
            fontSize: '10px',
            color: '#9ca3af'
          }}>
            📱 Generated via QR Code Scan • Internal Asset List • {simpleEquipment.length} item(s) total
          </div>
        </div>

        {/* ===== زر الطباعة ===== */}
        <div className="ot-no-print" style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 30px',
              background: '#006341',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,99,65,0.25)'
            }}
          >
            🖨️ Print Sheet
          </button>
        </div>

        {imageModal && (
          <div
            className="ot-no-print"
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, cursor: 'pointer'
            }}
            onClick={() => setImageModal(null)}
          >
            <img src={imageModal} alt="Equipment" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} />
          </div>
        )}
      </div>
    );
  }

  // ========== RENDER (Full Page) ==========
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ marginBottom: "20px" }}><Icons.loading /></div>
        <p>Loading departments...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: "30px",
      maxWidth: "1600px",
      margin: "0 auto",
      background: "#f5f7f6",
      minHeight: "100vh"
    }}>

      {/* ===== HEADER ===== */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", color: "#004d32", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Icons.hospital />
            OT Department Management
          </h1>
          <p style={{ color: "#6b7280", margin: "5px 0 0" }}>
            Manage departments, lists, and equipment
          </p>
        </div>
        <span style={{
          padding: "6px 16px",
          borderRadius: "20px",
          background: isAdmin ? "#d1fae5" : "#fef3c7",
          color: isAdmin ? "#065f46" : "#92400e",
          fontSize: "13px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          {isAdmin ? <Icons.admin /> : <Icons.staff />}
          {isAdmin ? "Admin Mode" : "Staff Mode"}
        </span>
      </div>

      {/* ===== TWO COLUMN LAYOUT ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: "24px",
        alignItems: "start"
      }}>

        {/* ===== LEFT COLUMN: DEPARTMENTS & LISTS ===== */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>

          {/* DEPARTMENTS SECTION */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <h2 style={{
              fontSize: "16px",
              color: "#004d32",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Icons.hospital />
              Departments
            </h2>

            {isAdmin && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "14px"
              }}>
                <input
                  type="text"
                  placeholder="Department name..."
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleAddDept}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      background: "#006341",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "13px"
                    }}
                  >
                    <Icons.add />
                    {editingDeptId ? "Update" : "Add"}
                  </button>
                  {editingDeptId && (
                    <button
                      onClick={() => { setEditingDeptId(null); setNewDept({ name: "", description: "" }); }}
                      style={{
                        padding: "8px 16px",
                        background: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "13px"
                      }}
                    >
                      <Icons.cancel />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {departments.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>No departments added yet.</p>
              ) : (
                departments.map(dept => (
                  <div
                    key={dept.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: selectedDeptId === dept.id ? "2px solid #006341" : "1px solid #d0e8dc",
                      background: selectedDeptId === dept.id ? "#e6f0ec" : "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                    onClick={() => {
                      setSelectedDeptId(dept.id);
                      setSelectedListId(null);
                      fetchLists(dept.id);
                    }}
                  >
                    <Icons.hospital />
                    <span style={{ flex: 1, fontWeight: selectedDeptId === dept.id ? "600" : "400" }}>
                      {dept.name}
                    </span>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: "2px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <Icons.edit />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id, dept.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <Icons.delete />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LISTS SECTION */}
          {selectedDeptId && (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h2 style={{
                fontSize: "16px",
                color: "#004d32",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Icons.list />
                Lists
              </h2>

              {isAdmin && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "14px"
                }}>
                  <input
                    type="text"
                    placeholder="List name..."
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleAddList}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background: "#c9a84c",
                        color: "#004d32",
                        border: "none",
                        borderRadius: "8px",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: saving ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontSize: "13px"
                      }}
                    >
                      {saving ? "⏳" : <Icons.add />}
                      {editingListId ? "Update" : "Add"}
                    </button>
                    {editingListId && (
                      <button
                        onClick={() => { setEditingListId(null); setNewList({ name: "", description: "" }); }}
                        style={{
                          padding: "8px 16px",
                          background: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "13px"
                        }}
                      >
                        <Icons.cancel />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {currentLists.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "13px" }}>No lists in this department.</p>
                ) : (
                  currentLists.map(list => (
                    <div
                      key={list.id}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: selectedListId === list.id ? "2px solid #c9a84c" : "1px solid #d0e8dc",
                        background: selectedListId === list.id ? "#fef9ec" : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                      onClick={() => {
                        setSelectedListId(list.id);
                        fetchEquipment(list.id);
                      }}
                    >
                      <Icons.list />
                      <span style={{ flex: 1 }}>{list.name}</span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        ({equipment[list.id]?.length || 0})
                      </span>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: "2px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditList(list); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          >
                            <Icons.edit />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          >
                            <Icons.delete />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN: EQUIPMENT ===== */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px"
          }}>
            <h2 style={{
              fontSize: "18px",
              color: "#004d32",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Icons.equipment />
              Equipment {selectedListId && `- ${currentLists.find(l => l.id === selectedListId)?.name || ""}`}
            </h2>

            {selectedListId && currentEquipment.length > 0 && (
              <button
                onClick={startCheck}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #004d32, #006341)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "13px",
                  boxShadow: "0 3px 10px rgba(0,77,50,0.25)"
                }}
              >
                <Icons.checkCircle />
                Start Checklist
              </button>
            )}
          </div>

          {!selectedListId ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
              <div style={{ marginBottom: "16px" }}><Icons.equipment /></div>
              <p style={{ fontSize: "16px" }}>Select a list from the left panel to manage equipment</p>
            </div>
          ) : (
            <>
              {/* Add Equipment Form */}
              {isAdmin && (
                <div style={{
                  background: "#f8fafb",
                  padding: "16px",
                  borderRadius: "12px",
                  marginBottom: "24px"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px"
                  }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Equipment name"
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Code *
                      </label>
                      <input
                        type="text"
                        placeholder="Equipment code"
                        value={newEquipment.code}
                        onChange={(e) => setNewEquipment({ ...newEquipment, code: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newEquipment.quantity}
                        onChange={(e) => setNewEquipment({ ...newEquipment, quantity: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        style={{
                          padding: "8px 16px",
                          background: "#e5e7eb",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          flex: 1
                        }}
                      >
                        <Icons.camera />
                        Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('equipFileInput').click()}
                        style={{
                          padding: "8px 16px",
                          background: "#e5e7eb",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          flex: 1
                        }}
                      >
                        <Icons.upload />
                        Upload
                      </button>
                    </div>
                  </div>

                  <input
                    id="equipFileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />

                  {imagePreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <button
                        onClick={() => { setImagePreview(null); setNewEquipment(prev => ({ ...prev, image: null })); }}
                        style={{ color: "#dc2626", cursor: "pointer", border: "none", background: "none", fontSize: "16px" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleAddEquipment}
                      disabled={saving}
                      style={{
                        padding: "8px 24px",
                        background: "#006341",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: saving ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px"
                      }}
                    >
                      {saving ? "⏳" : <Icons.add />}
                      {editingEquipId ? "Update" : "Add"}
                    </button>
                    {editingEquipId && (
                      <button
                        onClick={resetEquipmentForm}
                        style={{
                          padding: "8px 16px",
                          background: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "13px"
                        }}
                      >
                        <Icons.cancel />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ===== EQUIPMENT LIST HEADER WITH QR CODE ===== */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "2px solid #e5e7eb"
              }}>
                <div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#004d32",
                    margin: 0
                  }}>
                    Instrument Set
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "4px 0 0"
                  }}>
                    Total Instruments: <strong style={{ color: "#004d32" }}>{filteredAndSortedEquipment.length}</strong>
                  </p>
                </div>

                {/* QR Code & Search */}
                <div style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  {/* QR Code */}
                  <div
                    onClick={() => setShowQRModal(true)}
                    style={{
                      cursor: 'pointer',
                      background: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '2px solid #006341',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 8px rgba(0,99,65,0.1)',
                      minWidth: '80px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,99,65,0.2)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#006341';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,99,65,0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <QRCodeCanvas
                      value={getQRUrl()}
                      size={70}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#006341"
                    />
                    <div style={{
                      fontSize: '9px',
                      color: '#006341',
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: '0.3px'
                    }}>
                      📱 Scan Me
                    </div>
                  </div>

                  {/* Search */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "white",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    padding: "4px 10px"
                  }}>
                    <Icons.search />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        border: "none",
                        padding: "6px 4px",
                        fontSize: "13px",
                        outline: "none",
                        width: "120px",
                        background: "transparent"
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          fontSize: "14px",
                          padding: "2px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "white",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="quantity">Sort by Quantity</option>
                  </select>
                </div>
              </div>

              {/* ===== EQUIPMENT TABLE ===== */}
              {filteredAndSortedEquipment.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#9ca3af"
                }}>
                  <div style={{ marginBottom: "16px" }}>
                    <Icons.empty />
                  </div>
                  <h3 style={{ fontSize: "18px", color: "#6b7280", margin: "0 0 8px 0" }}>
                    No Instruments Found
                  </h3>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {searchTerm ? "Try adjusting your search." : "Start by adding a new instrument."}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  overflow: "hidden"
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#e5e5e5" }}>
                          <th style={equipThStyle}>No.</th>
                          <th style={{ ...equipThStyle, textAlign: "center" }}>Image</th>
                          <th style={{ ...equipThStyle, textAlign: "left" }}>Item Description</th>
                          <th style={{ ...equipThStyle, textAlign: "left" }}>Code</th>
                          <th style={{ ...equipThStyle, textAlign: "center" }}>Qty</th>
                          {isAdmin && <th style={{ ...equipThStyle, textAlign: "center" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedEquipment.map((item, idx) => (
                          <tr key={item.id} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f5f5f5" }}>
                            <td style={{ ...equipTdStyle, textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ ...equipTdStyle, textAlign: "center" }}>
                              {item.image ? (
                                <button
                                  onClick={() => setImageModal(item.image)}
                                  title="View image"
                                  style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: "#000000",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "inline-block",
                                    margin: "0 auto",
                                    padding: 0,
                                    transition: "opacity 0.15s"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.65"}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                />
                              ) : (
                                <div style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  background: "#cccccc",
                                  margin: "0 auto"
                                }} />
                              )}
                            </td>
                            <td style={{ ...equipTdStyle, fontWeight: "600" }}>{item.name}</td>
                            <td style={{ ...equipTdStyle, fontFamily: "monospace" }}>{item.code}</td>
                            <td style={{ ...equipTdStyle, textAlign: "center", fontWeight: "700" }}>{item.quantity}</td>
                            {isAdmin && (
                              <td style={{ ...equipTdStyle, textAlign: "center" }}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                  <button
                                    onClick={() => handleEditEquipment(item)}
                                    title="Edit"
                                    style={{
                                      padding: "6px 8px",
                                      background: "#c9a84c",
                                      color: "#004d32",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    <Icons.edit />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEquipment(item.id, item.name)}
                                    title="Delete"
                                    style={{
                                      padding: "6px 8px",
                                      background: "#fee2e2",
                                      color: "#991b1b",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    <Icons.delete />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{
                    textAlign: "center",
                    padding: "10px",
                    background: "#f0f0f0",
                    borderTop: "2px solid #000000",
                    fontSize: "10px",
                    color: "#000000"
                  }}>
                    Internal Asset List • {filteredAndSortedEquipment.length} item(s) total
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== QR MODAL ===== */}
      {showQRModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              maxWidth: '90%',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ✕
            </button>

            <h3 style={{ marginBottom: '5px', color: '#004d32', marginTop: '0' }}>
              📋 {selectedListName || "Instrument Set"}
            </h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
              {selectedDeptName || "Department"} • Scan this QR to view equipment list only
            </p>

            <QRCodeCanvas
              value={getQRUrl()}
              size={280}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#006341"
            />

            <p style={{ fontSize: '11px', color: '#999', marginTop: '15px', wordBreak: 'break-all' }}>
              {getQRUrl()}
            </p>

            <button
              onClick={() => setShowQRModal(false)}
              style={{
                marginTop: '15px',
                padding: '8px 30px',
                background: '#006341',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== Image Modal ===== */}
      {imageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer"
          }}
          onClick={() => setImageModal(null)}
        >
          <img
            src={imageModal}
            alt="Equipment"
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}

export default OTDepartment;