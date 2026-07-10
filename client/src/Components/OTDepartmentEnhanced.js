/**
 * OT Department Enhanced - Operating Rooms Management System
 * Integrated system for managing operating rooms and tracking equipment usage
 */

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

// ✅ SVG Icons - أيقونات مناسبة لكل تخصص
const Icons = {
  // أيقونات عامة
  Add: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="2" fill="#006341"/>
      <rect x="13" y="4" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
      <rect x="4" y="13" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
      <rect x="13" y="13" width="7" height="7" rx="2" fill="#c9a84c"/>
    </svg>
  ),
  List: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
      <rect x="13" y="4" width="7" height="7" rx="2" fill="#c9a84c"/>
      <rect x="4" y="13" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
      <rect x="13" y="13" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
    </svg>
  ),
  Equipment: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#006341" strokeWidth="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="#c9a84c"/>
      <path d="M21 15L16 10L5 21" stroke="#006341" strokeWidth="2"/>
    </svg>
  ),
  Surgery: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#006341" opacity="0.5"/>
      <path d="M2 17l10 5 10-5" stroke="#006341" strokeWidth="2"/>
      <path d="M2 12l10 5 10-5" stroke="#006341" strokeWidth="2"/>
    </svg>
  ),
  Surgeon: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" fill="#c9a84c" opacity="0.5"/>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#006341" strokeWidth="2"/>
    </svg>
  ),
  Time: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#006341" strokeWidth="2"/>
      <path d="M12 7V12L15 15" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Edit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M17 3L21 7L7 21L3 21L3 17L17 3Z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  Delete: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 6H21" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="#dc2626" strokeWidth="2"/>
      <path d="M19 6L18 20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20L5 6" stroke="#dc2626" strokeWidth="2"/>
    </svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17L4 12" stroke="#006341" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Image: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#006341" strokeWidth="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="#c9a84c"/>
      <path d="M21 15L16 10L5 21" stroke="#006341" strokeWidth="2"/>
    </svg>
  ),

  // أيقونات الغرف حسب التخصص
  Orthopedic: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#006341" opacity="0.3"/>
      <path d="M7 10L7 17M17 10L17 17" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="3" fill="#c9a84c" opacity="0.5"/>
    </svg>
  ),
  ENT: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3" fill="#006341" opacity="0.3"/>
      <path d="M8 13C9.5 15.5 14.5 15.5 16 13" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 16L8 21M14 16L16 21" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  General: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="#006341" strokeWidth="2"/>
      <path d="M12 8V16M8 12H16" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Dental: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 4C9 4 6 6 6 9V16C6 18 8 20 12 20C16 20 18 18 18 16V9C18 6 15 4 12 4Z" stroke="#006341" strokeWidth="2"/>
      <path d="M9 9L9 13M15 9L15 13" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Cardiac: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15 3 9C3 5 6 3 8 3C10 3 12 5 12 7C12 5 14 3 16 3C18 3 21 5 21 9C21 15 12 21 12 21Z" fill="#006341" opacity="0.3" stroke="#006341" strokeWidth="2"/>
      <path d="M10 9L12 11L14 9" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Neuro: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="10" r="4" stroke="#006341" strokeWidth="2"/>
      <path d="M8 14C10 16 14 16 16 14" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 6L12 2M12 18L12 22" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 10L2 10M22 10L18 10" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Ophthal: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="#006341" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="#c9a84c" opacity="0.5"/>
      <path d="M3 12C3 12 6 6 12 6C18 6 21 12 21 12C21 12 18 18 12 18C6 18 3 12 3 12Z" stroke="#006341" strokeWidth="2"/>
    </svg>
  ),
  Pediatric: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="10" r="4" fill="#006341" opacity="0.3"/>
      <path d="M12 14V18M9 16H15" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 20L8 16M20 20L16 16" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  RoomIcon: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#006341" strokeWidth="2"/>
      <path d="M9 8H15M9 12H13" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

function OTDepartmentEnhanced() {
  const [confirmedLists, setConfirmedLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeSurgery, setActiveSurgery] = useState(null);
  const [surgeryHistory, setSurgeryHistory] = useState([]);
  const [serverIP, setServerIP] = useState(window.location.hostname);
  
  // حالة إضافة لستا جديدة
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [customLists, setCustomLists] = useState([]);
  const [editingListId, setEditingListId] = useState(null);
  
  // حالة إضافة أداة
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    code: '',
    quantity: 1,
    status: 'Available',
    image: null
  });
  const [equipmentList, setEquipmentList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Surgery details
  const [surgeryDetails, setSurgeryDetails] = useState({
    surgeryName: '',
    surgeonName: '',
    assistantName: '',
    startTime: new Date().toISOString().slice(0, 16),
    estimatedDuration: '60',
    notes: ''
  });

  // Operating Rooms مع أيقونات مناسبة لكل تخصص
  const operatingRooms = [
    { id: 'OR1', name: 'Operating Room 1', specialty: 'ORTH', label: 'Orthopedic Surgery', icon: <Icons.Orthopedic /> },
    { id: 'OR2', name: 'Operating Room 2', specialty: 'ENT', label: 'ENT Surgery', icon: <Icons.ENT /> },
    { id: 'OR3', name: 'Operating Room 3', specialty: 'General', label: 'General Surgery', icon: <Icons.General /> },
    { id: 'OR4', name: 'Operating Room 4', specialty: 'Dental', label: 'Dental Surgery', icon: <Icons.Dental /> },
    { id: 'OR5', name: 'Operating Room 5', specialty: 'Cardiac', label: 'Cardiac Surgery', icon: <Icons.Cardiac /> },
    { id: 'OR6', name: 'Operating Room 6', specialty: 'Neuro', label: 'Neurosurgery', icon: <Icons.Neuro /> },
    { id: 'OR7', name: 'Operating Room 7', specialty: 'Ophthal', label: 'Ophthalmology', icon: <Icons.Ophthal /> },
    { id: 'OR8', name: 'Operating Room 8', specialty: 'Pediatric', label: 'Pediatric Surgery', icon: <Icons.Pediatric /> },
  ];

  const currentPort = window.location.port ? `:${window.location.port}` : "";

  useEffect(() => {
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      setServerIP('192.168.8.93');
    } else {
      setServerIP(currentHostname);
    }
  }, []);

  useEffect(() => {
    fetchConfirmedChecklists();
    fetchCustomLists();
    const savedHistory = localStorage.getItem('surgeryHistory');
    if (savedHistory) {
      try {
        setSurgeryHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  const fetchCustomLists = async () => {
    try {
      const response = await fetch(`${API_BASE}/ot-custom-lists`);
      const data = await response.json();
      if (data.success) {
        setCustomLists(data.data);
      }
    } catch (err) {
      console.error('Error fetching custom lists:', err);
    }
  };

  const fetchConfirmedChecklists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/checklist/confirmed/all`);
      const data = await response.json();
      if (data.success) {
        setConfirmedLists(data.data);
      }
    } catch (err) {
      console.error('Error fetching confirmed lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptCode) => {
    const deptNames = {
      'ORTH': 'Orthopedic',
      'ENT': 'E.N.T',
      'General': 'General Surgery',
      'Dental': 'Dental',
      'Cardiac': 'Cardiac',
      'Neuro': 'Neurosurgery',
      'Ophthal': 'Ophthalmology',
      'Pediatric': 'Pediatric',
    };
    return deptNames[deptCode] || deptCode;
  };

  // دوال حفظ وإدارة اللستات والأدوات
  const handleSaveList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    setSaving(true);
    try {
      if (editingListId) {
        const response = await fetch(`${API_BASE}/ot-custom-lists/${editingListId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newListName.trim(),
            description: newListDescription.trim(),
            deptCode: selectedRoom?.specialty || 'General',
            roomId: selectedRoom?.id || null
          })
        });
        const data = await response.json();
        if (data.success) {
          await fetchCustomLists();
          if (selectedList && selectedList.id === editingListId) {
            const updatedList = customLists.find(l => l.id === editingListId);
            if (updatedList) setSelectedList(updatedList);
          }
          setEditingListId(null);
        }
      } else {
        const newListId = 'custom_' + Date.now();
        const response = await fetch(`${API_BASE}/ot-custom-lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newListId,
            name: newListName.trim(),
            description: newListDescription.trim(),
            deptCode: selectedRoom?.specialty || 'General',
            roomId: selectedRoom?.id || null,
            createdBy: localStorage.getItem('userName') || 'Admin'
          })
        });
        const data = await response.json();
        if (data.success) {
          await fetchCustomLists();
          const newList = data.data;
          setSelectedList(newList);
          setEquipmentList([]);
        }
      }
      
      setNewListName('');
      setNewListDescription('');
      setShowAddList(false);
    } catch (err) {
      console.error('Error saving list:', err);
      alert('Error saving list: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditList = (list) => {
    setEditingListId(list.id);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setShowAddList(true);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/ot-custom-lists/${listId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomLists();
        if (selectedList && selectedList.id === listId) {
          setSelectedList(null);
          setEquipmentList([]);
        }
      }
    } catch (err) {
      console.error('Error deleting list:', err);
      alert('Error deleting list: ' + err.message);
    }
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim() || !newEquipment.code.trim()) {
      alert('Please enter equipment name and code');
      return;
    }

    if (!selectedList) {
      alert('Please select a list first');
      return;
    }

    setSaving(true);
    try {
      const newItemId = 'eq_' + Date.now();
      const response = await fetch(`${API_BASE}/ot-custom-equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newItemId,
          listId: selectedList.id,
          name: newEquipment.name.trim(),
          code: newEquipment.code.trim(),
          quantity: parseInt(newEquipment.quantity) || 1,
          status: newEquipment.status,
          image: newEquipment.image || null
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomLists();
        const updatedList = customLists.find(l => l.id === selectedList.id);
        if (updatedList) {
          setSelectedList(updatedList);
          setEquipmentList(updatedList.equipment || []);
        }
        resetEquipmentForm();
      }
    } catch (err) {
      console.error('Error adding equipment:', err);
      alert('Error adding equipment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditEquipment = (item) => {
    setEditingEquipmentId(item.id);
    setNewEquipment({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      status: item.status || 'Available',
      image: item.image || null
    });
    setImagePreview(item.image || null);
    setShowAddEquipment(true);
  };

  const handleUpdateEquipment = async () => {
    if (!newEquipment.name.trim() || !newEquipment.code.trim()) {
      alert('Please enter equipment name and code');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/ot-custom-equipment/${editingEquipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEquipment.name.trim(),
          code: newEquipment.code.trim(),
          quantity: parseInt(newEquipment.quantity) || 1,
          status: newEquipment.status,
          image: newEquipment.image || null
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomLists();
        const updatedList = customLists.find(l => l.id === selectedList.id);
        if (updatedList) {
          setSelectedList(updatedList);
          setEquipmentList(updatedList.equipment || []);
        }
        resetEquipmentForm();
      }
    } catch (err) {
      console.error('Error updating equipment:', err);
      alert('Error updating equipment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetEquipmentForm = () => {
    setNewEquipment({ name: '', code: '', quantity: 1, status: 'Available', image: null });
    setImagePreview(null);
    setShowAddEquipment(false);
    setEditingEquipmentId(null);
  };

  // ✅ دالة رفع الصورة من الملفات
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large! Maximum 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setNewEquipment(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ دالة التقاط الصورة من الكاميرا
  const handleCapturePhoto = () => {
    // إنشاء input مؤقت للكاميرا
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 'environment' للكاميرا الخلفية، 'user' للكاميرا الأمامية
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image too large! Maximum 5MB');
          return;
        }
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

  const handleDeleteEquipment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/ot-custom-equipment/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomLists();
        const updatedList = customLists.find(l => l.id === selectedList.id);
        if (updatedList) {
          setSelectedList(updatedList);
          setEquipmentList(updatedList.equipment || []);
        }
      }
    } catch (err) {
      console.error('Error deleting equipment:', err);
      alert('Error deleting equipment: ' + err.message);
    }
  };

  const handleSelectList = (list) => {
    setSelectedList(list);
    setEquipmentList(list.equipment || []);
    setShowAddEquipment(false);
    setEditingEquipmentId(null);
  };

  const getDisplayLists = () => {
    const custom = customLists.map(list => ({
      ...list,
      _id: list.id,
      listName: list.name,
      equipmentDetails: list.equipment || [],
      isCustom: true
    }));
    const confirmed = confirmedLists.map(list => ({
      ...list,
      isCustom: false
    }));
    return [...custom, ...confirmed];
  };

  const displayLists = getDisplayLists();

  const filteredLists = selectedRoom 
    ? displayLists.filter(list => {
        if (list.isCustom) {
          return list.deptCode === selectedRoom.specialty || selectedRoom.specialty === 'General';
        }
        return list.deptCode === selectedRoom.specialty || selectedRoom.specialty === 'General';
      })
    : [];

  const equipmentViewUrl = selectedList 
    ? `${window.location.protocol}//${serverIP}${currentPort}/department/OT/list/${selectedList.id || selectedList._id}?view=simple`
    : '';

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-US');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': { text: 'Active', color: '#d1fae5', textColor: '#065f46' },
      'completed': { text: 'Completed', color: '#dbeafe', textColor: '#1e40af' },
      'cancelled': { text: 'Cancelled', color: '#fee2e2', textColor: '#991b1b' }
    };
    return badges[status] || badges['active'];
  };

  const handleEndSurgery = () => {
    if (!activeSurgery) return;
    
    const updatedHistory = surgeryHistory.map(s => 
      s.id === activeSurgery.id 
        ? { ...s, status: 'completed', endedAt: new Date().toISOString() }
        : s
    );
    setSurgeryHistory(updatedHistory);
    localStorage.setItem('surgeryHistory', JSON.stringify(updatedHistory));
    setActiveSurgery(null);
    setSelectedList(null);
    setEquipmentList([]);
    setSurgeryDetails({
      surgeryName: '',
      surgeonName: '',
      assistantName: '',
      startTime: new Date().toISOString().slice(0, 16),
      estimatedDuration: '60',
      notes: ''
    });
    alert('✅ Surgery Completed Successfully!');
  };

  const handleCancelSurgery = () => {
    if (!activeSurgery) return;
    if (!window.confirm('Are you sure you want to cancel this surgery?')) return;
    
    const updatedHistory = surgeryHistory.map(s => 
      s.id === activeSurgery.id 
        ? { ...s, status: 'cancelled', endedAt: new Date().toISOString() }
        : s
    );
    setSurgeryHistory(updatedHistory);
    localStorage.setItem('surgeryHistory', JSON.stringify(updatedHistory));
    setActiveSurgery(null);
    setSelectedList(null);
    setEquipmentList([]);
    alert('❌ Surgery Cancelled');
  };

  const openImageModal = (imageUrl) => {
    setImageModal(imageUrl);
  };

  const closeImageModal = () => {
    setImageModal(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#006341' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⌛</div>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>Loading Operating Rooms System...</div>
      </div>
    );
  }

  return (
    <div className="ot-enhanced-container">
      {/* Header */}
      <header className="ot-header">
        <div>
          <h1>🏥 Operating Rooms Management</h1>
          <p>Select room, add lists, and manage equipment</p>
        </div>
        {activeSurgery && (
          <div className="active-surgery-badge">
            <span className="badge-dot"></span>
            Active Surgery: {activeSurgery.surgeryName}
          </div>
        )}
      </header>

      <div className="main-layout">
        {/* Left Side - Selection */}
        <div className="left-panel">
          {/* 1. Select Operating Room */}
          <section className="section-card">
            <h2 className="section-title">
              <Icons.RoomIcon /> Select Operating Room
            </h2>
            <div className="rooms-grid">
              {operatingRooms.map(room => (
                <div 
                  key={room.id} 
                  className={`room-box ${selectedRoom?.id === room.id ? 'active' : ''} ${activeSurgery?.room?.id === room.id ? 'in-use' : ''}`}
                  onClick={() => {
                    if (activeSurgery) {
                      alert('⚠️ Cannot change room while surgery is in progress');
                      return;
                    }
                    setSelectedRoom(room);
                    setSelectedList(null);
                    setEquipmentList([]);
                    setShowAddList(false);
                    setEditingListId(null);
                  }}
                >
                  <div className="room-icon">{room.icon}</div>
                  <div className="room-text">
                    <strong>{room.name}</strong>
                    <small>{room.label}</small>
                    {activeSurgery?.room?.id === room.id && (
                      <span className="room-status">● In Use</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Add/Edit List */}
          {selectedRoom && !activeSurgery && (
            <section className="section-card">
              <h2 className="section-title">
                <Icons.Add /> {editingListId ? 'Edit List' : 'Add New List'}
              </h2>
              {!showAddList ? (
                <button 
                  className="add-list-btn"
                  onClick={() => setShowAddList(true)}
                >
                  <Icons.Add /> Add New List
                </button>
              ) : (
                <div className="add-list-form">
                  <div className="form-group">
                    <label>List Name *</label>
                    <input
                      type="text"
                      placeholder="Enter list name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Enter description"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveList} disabled={saving}>
                      {saving ? '⏳ Saving...' : (editingListId ? '✅ Update List' : '✅ Save List')}
                    </button>
                    <button className="btn-cancel" onClick={() => { 
                      setShowAddList(false); 
                      setNewListName(''); 
                      setNewListDescription('');
                      setEditingListId(null);
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. Select Checklist */}
          {selectedRoom && !activeSurgery && (
            <section className="section-card">
              <h2 className="section-title">
                <Icons.List /> Select Equipment Checklist
              </h2>
              <div className="lists-scroll-area">
                {filteredLists.length > 0 ? (
                  filteredLists.map(list => {
                    const isInUse = surgeryHistory.some(s => 
                      (s.list?._id === list._id || s.list?.id === list.id) && s.status === 'active'
                    );
                    const totalItems = list.equipmentDetails?.length || list.equipment?.length || 0;
                    const isCustom = list.isCustom;
                    
                    return (
                      <div 
                        key={list._id || list.id} 
                        className={`list-selection-item ${selectedList?._id === list._id || selectedList?.id === list.id ? 'active' : ''} ${isInUse ? 'in-use' : ''}`}
                      >
                        <div 
                          className="list-selection-content"
                          onClick={() => {
                            if (isInUse) {
                              alert('⚠️ This checklist is currently in use by another surgery');
                              return;
                            }
                            handleSelectList(list);
                          }}
                        >
                          <span className="check-mark">
                            {selectedList?._id === list._id || selectedList?.id === list.id ? <Icons.Check /> : <span style={{ opacity: 0.3 }}>○</span>}
                          </span>
                          <div className="list-info">
                            <strong>{list.listName || list.name}</strong>
                            <small>{list.description || getDepartmentName(list.deptCode)}</small>
                            <span className="list-count">📦 {totalItems} items</span>
                            {isCustom && <span className="custom-badge">Custom</span>}
                          </div>
                        </div>
                        {isCustom && (
                          <div className="list-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="list-edit-btn" 
                              onClick={() => handleEditList(list)}
                              title="Edit list"
                            >
                              <Icons.Edit />
                            </button>
                            <button 
                              className="list-delete-btn" 
                              onClick={() => handleDeleteList(list.id)}
                              title="Delete list"
                            >
                              <Icons.Delete />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-data-msg">
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                    <p>No lists available for {selectedRoom.label}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Click "Add New List" to create one</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Side - Selected List Details */}
        <div className="right-panel">
          {selectedList ? (
            <div className="selected-list-card">
              <div className="selected-list-header">
                <div>
                  <h2>📋 {selectedList.listName || selectedList.name}</h2>
                  <p className="list-dept">{selectedList.description || getDepartmentName(selectedList.deptCode)}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* ✅ QR Code مكبر وواضح */}
                  {selectedList.id && (
                    <div className="mini-qr">
                      <QRCodeCanvas 
                        value={equipmentViewUrl} 
                        size={80}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#006341"
                      />
                    </div>
                  )}
                  <button 
                    className="add-equipment-btn"
                    onClick={() => {
                      setShowAddEquipment(!showAddEquipment);
                      if (!showAddEquipment) {
                        setEditingEquipmentId(null);
                        setNewEquipment({ name: '', code: '', quantity: 1, status: 'Available', image: null });
                        setImagePreview(null);
                      }
                    }}
                  >
                    <Icons.Add /> Add Equipment
                  </button>
                </div>
              </div>

              {/* نموذج إضافة/تعديل أداة */}
              {showAddEquipment && (
                <div className="add-equipment-form">
                  <h4 style={{ margin: '0 0 10px 0', color: '#004d32', fontSize: '14px' }}>
                    {editingEquipmentId ? '✏️ Edit Equipment' : '➕ Add New Equipment'}
                  </h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>🔧 Name *</label>
                      <input
                        type="text"
                        placeholder="Equipment name"
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>🔢 Code *</label>
                      <input
                        type="text"
                        placeholder="Equipment code"
                        value={newEquipment.code}
                        onChange={(e) => setNewEquipment({...newEquipment, code: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>📦 Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newEquipment.quantity}
                        onChange={(e) => setNewEquipment({...newEquipment, quantity: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>📷 Image</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div className="upload-buttons-group">
                          <button 
                            type="button"
                            className="upload-btn upload-file"
                            onClick={() => document.getElementById('fileInput').click()}
                          >
                            📁 Choose File
                          </button>
                          <button 
                            type="button"
                            className="upload-btn upload-camera"
                            onClick={handleCapturePhoto}
                          >
                            📸 Take Photo
                          </button>
                        </div>
                        <input
                          id="fileInput"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <small style={{ color: '#6b7280', fontSize: '10px' }}>
                        📁 Choose from computer or 📸 Take photo with camera
                      </small>
                      {imagePreview && (
                        <div className="image-preview-mini">
                          <img src={imagePreview} alt="Preview" />
                          <button onClick={() => { setImagePreview(null); setNewEquipment(prev => ({...prev, image: null})); }}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-actions">
                    {editingEquipmentId ? (
                      <button className="btn-save" onClick={handleUpdateEquipment} disabled={saving}>
                        {saving ? '⏳ Updating...' : '✅ Update Equipment'}
                      </button>
                    ) : (
                      <button className="btn-save" onClick={handleAddEquipment} disabled={saving}>
                        {saving ? '⏳ Adding...' : '✅ Add Equipment'}
                      </button>
                    )}
                    <button className="btn-cancel" onClick={resetEquipmentForm}>Cancel</button>
                  </div>
                </div>
              )}

              {/* جدول الأدوات */}
              <div className="equipment-section">
                <div className="equipment-header">
                  <h3><Icons.Equipment /> Equipment Items</h3>
                  <span className="equipment-count">{equipmentList.length} items</span>
                </div>
                {equipmentList.length > 0 ? (
                  <div className="equipment-table-wrap">
                    <table className="equipment-mini-table">
                      <thead>
                        <tr>
                          <th><Icons.Image /></th>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Qty</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentList.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="eq-mini-img"
                                  onClick={() => openImageModal(item.image)}
                                  style={{ cursor: 'pointer' }}
                                />
                              ) : (
                                <span className="eq-mini-placeholder">📷</span>
                              )}
                            </td>
                            <td>{item.name}</td>
                            <td>{item.code}</td>
                            <td>{item.quantity}</td>
                            <td>
                              <button className="edit-eq-btn" onClick={() => handleEditEquipment(item)}>
                                <Icons.Edit />
                              </button>
                              <button className="delete-eq-btn" onClick={() => handleDeleteEquipment(item.id)}>
                                <Icons.Delete />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-equipment-msg">
                    <p>No equipment added yet</p>
                    <p className="hint">Click "Add Equipment" to add items</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No List Selected</h3>
              <p>Select a list from the left panel or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Surgery */}
      {activeSurgery && (
        <section className="section-card active-surgery-card">
          <h2 className="section-title">🔴 Active Surgery</h2>
          <div className="active-surgery-details">
            <div className="surgery-info-grid">
              <div className="info-item">
                <span className="info-label"><Icons.RoomIcon /> Room</span>
                <span className="info-value">{activeSurgery.room?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Icons.Surgery /> Surgery</span>
                <span className="info-value">{activeSurgery.surgeryName}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Icons.Surgeon /> Surgeon</span>
                <span className="info-value">{activeSurgery.surgeonName}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Icons.List /> Checklist</span>
                <span className="info-value">{activeSurgery.list?.listName || activeSurgery.list?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Icons.Equipment /> Equipment Count</span>
                <span className="info-value">{activeSurgery.equipmentCount} items</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Icons.Time /> Start Time</span>
                <span className="info-value">{formatTime(activeSurgery.startedAt)}</span>
              </div>
            </div>
            <div className="surgery-actions">
              <button className="btn-end-surgery" onClick={handleEndSurgery}>
                <Icons.Check /> Complete Surgery
              </button>
              <button className="btn-cancel-surgery" onClick={handleCancelSurgery}>
                ❌ Cancel Surgery
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          className="image-modal-overlay"
          onClick={closeImageModal}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              <Icons.Close />
            </button>
            <img src={imageModal} alt="Equipment" />
          </div>
        </div>
      )}

      <style>{`
        .ot-enhanced-container { 
          padding: 30px; 
          background: #f0f4f3; 
          min-height: 100vh; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 1500px; 
          margin: 0 auto;
        }

        .ot-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 30px; 
          background: white; 
          padding: 20px 30px; 
          border-radius: 16px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          flex-wrap: wrap;
          gap: 16px;
        }
        .ot-header h1 { 
          color: #004d32; 
          font-size: 28px; 
          margin: 0; 
        }
        .ot-header p { 
          color: #6a8a7a; 
          margin: 4px 0 0; 
          font-size: 14px; 
        }
        .active-surgery-badge {
          background: #d1fae5;
          color: #065f46;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: pulse 2s infinite;
        }
        .badge-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #065f46;
          border-radius: 50%;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .main-layout {
          display: flex;
          gap: 25px;
          margin-bottom: 30px;
        }

        .left-panel {
          flex: 0 0 42%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .right-panel {
          flex: 1;
        }

        .section-card { 
          background: white; 
          padding: 20px; 
          border-radius: 16px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
        }
        .section-title { 
          font-size: 16px; 
          color: #004d32; 
          margin: 0 0 14px 0; 
          padding-bottom: 10px; 
          border-bottom: 2px solid #e5ede9; 
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title svg {
          flex-shrink: 0;
        }

        .rooms-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
          gap: 12px; 
        }
        .room-box { 
          display: flex; 
          align-items: center; 
          gap: 14px; 
          padding: 14px 18px; 
          border: 2px solid #e5ede9; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: all 0.3s; 
          background: #fafdfb;
        }
        .room-box:hover { 
          border-color: #c9a84c; 
          background: #fffdf9; 
          transform: translateY(-2px);
        }
        .room-box.active { 
          border-color: #006341; 
          background: #e6f0ec; 
          box-shadow: 0 0 0 3px rgba(0,99,65,0.1);
        }
        .room-box.in-use {
          border-color: #f59e0b;
          background: #fef3c7;
        }
        .room-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .room-icon svg {
          width: 32px;
          height: 32px;
        }
        .room-text { 
          display: flex; 
          flex-direction: column;
        }
        .room-text strong { 
          display: block; 
          color: #004d32; 
          font-size: 14px;
        }
        .room-text small { 
          color: #888; 
          font-size: 12px; 
        }
        .room-status {
          font-size: 10px;
          font-weight: 600;
          color: #f59e0b;
          margin-top: 2px;
        }

        .add-list-btn {
          width: 100%;
          padding: 12px;
          background: #006341;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .add-list-btn:hover {
          background: #004d32;
          transform: translateY(-1px);
        }

        .add-list-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .add-list-form .form-group {
          display: flex;
          flex-direction: column;
        }
        .add-list-form .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 3px;
        }
        .add-list-form .form-group input {
          padding: 8px 12px;
          border: 1.5px solid #d0e8dc;
          border-radius: 8px;
          font-size: 13px;
        }
        .add-list-form .form-group input:focus {
          border-color: #006341;
          outline: none;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .btn-save {
          padding: 8px 20px;
          background: #006341;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-save:hover {
          background: #004d32;
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-cancel {
          padding: 8px 20px;
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .lists-scroll-area { 
          max-height: 320px; 
          overflow-y: auto; 
          padding-right: 4px;
        }
        .lists-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .lists-scroll-area::-webkit-scrollbar-thumb {
          background: #d0e8dc;
          border-radius: 4px;
        }

        .list-selection-item { 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          padding: 10px 14px; 
          border-bottom: 1px solid #f0f4f3; 
          border-radius: 8px; 
          transition: all 0.2s; 
          background: white;
        }
        .list-selection-item:hover { 
          background: #f0f7f4; 
        }
        .list-selection-item.active { 
          background: #006341; 
          color: white; 
        }
        .list-selection-item.active .list-info small { 
          color: rgba(255,255,255,0.7); 
        }
        .list-selection-item.active .list-actions button {
          color: white;
        }
        .list-selection-item.in-use {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .list-selection-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          cursor: pointer;
        }
        .list-selection-content .check-mark {
          display: flex;
          align-items: center;
        }

        .list-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .list-edit-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .list-edit-btn:hover {
          background: rgba(37, 99, 235, 0.1);
        }
        .list-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .list-delete-btn:hover {
          background: rgba(220, 38, 38, 0.1);
        }
        .list-selection-item.active .list-edit-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .list-selection-item.active .list-delete-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .list-info { 
          flex: 1; 
        }
        .list-info strong { 
          display: block; 
          font-size: 14px; 
        }
        .list-info small { 
          font-size: 12px; 
          color: #888; 
        }
        .list-count {
          font-size: 11px;
          color: #9ca3af;
          margin-left: 4px;
        }
        .custom-badge {
          font-size: 9px;
          background: #fef3c7;
          color: #92400e;
          padding: 1px 8px;
          border-radius: 10px;
          margin-left: 6px;
        }

        .no-data-msg { 
          text-align: center; 
          color: #9ca3af; 
          padding: 20px; 
        }

        .selected-list-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          height: 100%;
          border-left: 4px solid #006341;
          display: flex;
          flex-direction: column;
        }

        .selected-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5ede9;
          flex-wrap: wrap;
          gap: 10px;
        }
        .selected-list-header h2 {
          margin: 0;
          color: #004d32;
          font-size: 20px;
        }
        .list-dept {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .mini-qr {
          background: white;
          padding: 8px;
          border-radius: 10px;
          border: 2px solid #d0e8dc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mini-qr canvas {
          border-radius: 4px;
          width: 80px !important;
          height: 80px !important;
        }
        .add-equipment-btn {
          padding: 8px 16px;
          background: #c9a84c;
          color: #004d32;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .add-equipment-btn:hover {
          background: #b8943e;
          transform: translateY(-1px);
        }

        .add-equipment-form {
          background: #f8fafb;
          padding: 16px;
          border-radius: 12px;
          margin: 12px 0;
          border: 1px solid #e5ede9;
        }
        .add-equipment-form .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 10px;
        }
        .add-equipment-form .form-group {
          display: flex;
          flex-direction: column;
        }
        .add-equipment-form .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 3px;
        }
        .add-equipment-form .form-group input {
          padding: 8px 12px;
          border: 1.5px solid #d0e8dc;
          border-radius: 6px;
          font-size: 13px;
        }
        .add-equipment-form .form-group input:focus {
          border-color: #006341;
          outline: none;
        }
        .add-equipment-form .form-group input[type="file"] {
          padding: 4px;
        }

        .upload-buttons-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          width: 100%;
        }

        .upload-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
          min-width: 100px;
        }

        .upload-btn.upload-file {
          background: #e5ede9;
          color: #004d32;
        }

        .upload-btn.upload-file:hover {
          background: #d0e8dc;
          transform: translateY(-1px);
        }

        .upload-btn.upload-camera {
          background: #006341;
          color: white;
        }

        .upload-btn.upload-camera:hover {
          background: #004d32;
          transform: translateY(-1px);
        }

        .image-preview-mini {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }
        .image-preview-mini img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
        }
        .image-preview-mini button {
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          font-size: 16px;
        }

        .equipment-section {
          flex: 1;
          margin-top: 16px;
        }
        .equipment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .equipment-header h3 {
          margin: 0;
          color: #004d32;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .equipment-count {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 12px;
          border-radius: 12px;
        }

        .equipment-table-wrap {
          border: 1px solid #d0e8dc;
          border-radius: 10px;
          overflow: hidden;
          background: white;
          max-height: 300px;
          overflow-y: auto;
        }
        .equipment-mini-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .equipment-mini-table thead {
          background: #f0f7f4;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .equipment-mini-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #004d32;
          border-bottom: 1px solid #d0e8dc;
        }
        .equipment-mini-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f0f4f3;
          vertical-align: middle;
        }
        .equipment-mini-table tr:hover {
          background: #fafdfb;
        }

        .eq-mini-img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e5ede9;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .eq-mini-img:hover {
          transform: scale(1.1);
        }
        .eq-mini-placeholder {
          font-size: 20px;
        }

        .edit-eq-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
        }
        .edit-eq-btn:hover {
          background: rgba(37, 99, 235, 0.1);
        }

        .delete-eq-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
        }
        .delete-eq-btn:hover {
          background: rgba(220, 38, 38, 0.1);
        }

        .no-equipment-msg {
          text-align: center;
          padding: 30px;
          color: #9ca3af;
        }
        .no-equipment-msg .hint {
          font-size: 12px;
          color: #c9d4d0;
          margin-top: 4px;
        }

        .empty-state {
          background: white;
          border-radius: 16px;
          padding: 60px 30px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-left: 4px solid #e5ede9;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          margin: 0 0 8px;
          color: #004d32;
        }
        .empty-state p {
          margin: 0;
          color: #6b7280;
        }

        .active-surgery-card {
          border: 2px solid #006341;
          background: #f0fdf4;
          margin-top: 20px;
        }
        .active-surgery-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .surgery-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .info-label svg {
          width: 16px;
          height: 16px;
        }
        .info-value {
          font-size: 15px;
          color: #1f2937;
          font-weight: 500;
          margin-top: 4px;
        }
        .surgery-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .btn-end-surgery {
          background: #006341;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-end-surgery:hover {
          background: #004d32;
        }
        .btn-cancel-surgery {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel-surgery:hover {
          background: #fecaca;
        }

        .image-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          cursor: pointer;
        }

        .image-modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
        }

        .image-modal-content img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .image-modal-close {
          position: absolute;
          top: -50px;
          right: 0;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          backdrop-filter: blur(4px);
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 1024px) {
          .main-layout { flex-direction: column; }
          .left-panel { flex: 1; }
          .right-panel { flex: 1; }
          .selected-list-card { height: auto; }
        }

        @media (max-width: 768px) {
          .ot-enhanced-container { padding: 16px; }
          .add-equipment-form .form-row { grid-template-columns: 1fr; }
          .rooms-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
          .ot-header { flex-direction: column; text-align: center; }
          .ot-header h1 { font-size: 22px; }
          .selected-list-header { flex-direction: column; align-items: flex-start; }
          .active-surgery-badge { font-size: 12px; padding: 6px 14px; }
          .list-selection-item { flex-wrap: wrap; }
          .list-actions { margin-top: 4px; }
          .image-modal-close {
            top: -40px;
            font-size: 22px;
            padding: 6px 12px;
          }
          .room-box { padding: 10px 12px; }
          .room-icon svg { width: 28px; height: 28px; }
          .mini-qr canvas { width: 70px !important; height: 70px !important; }
          .upload-buttons-group { flex-direction: column; }
          .upload-btn { min-width: unset; }
        }

        @media (max-width: 480px) {
          .surgery-info-grid { grid-template-columns: 1fr; }
          .section-card { padding: 14px; }
          .room-box { padding: 8px 10px; }
          .equipment-mini-table { font-size: 12px; }
          .equipment-mini-table th, .equipment-mini-table td { padding: 6px 8px; }
          .eq-mini-img { width: 32px; height: 32px; }
          .image-modal-content { max-width: 95%; }
          .image-modal-close {
            top: -36px;
            font-size: 20px;
            padding: 4px 10px;
          }
          .room-icon svg { width: 24px; height: 24px; }
          .mini-qr canvas { width: 60px !important; height: 60px !important; }
        }
      `}</style>
    </div>
  );
}

export default OTDepartmentEnhanced;