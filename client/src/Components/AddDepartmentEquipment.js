// Components/AddDepartmentEquipment.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AIInstrumentSearch from './AIInstrumentSearch';

const API_BASE = `http://${window.location.hostname}:5000/api`;

function AddDepartmentEquipment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deptCode, listId } = useParams();

  const listName = location.state?.listName || "Equipment List";
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  const [formData, setFormData] = useState({
    name: "", code: "", quantity: "", status: "Available", notes: "", image: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAISearch, setShowAISearch] = useState(false);
<button 
  onClick={() => setShowAISearch(!showAISearch)}
  className="ai-search-btn"
>
  Searching for the tool
</button>

{showAISearch && (
  <AIInstrumentSearch 
    onSelectInstrument={(data) => {
      setFormData(prev => ({
        ...prev,
        name: data.name,
        image: data.image
      }));
      setShowAISearch(false);
    }}
  />
)}
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const statuses = ["Available", "In Use", "Under Maintenance", "Retired"];

  useEffect(() => {
    if (!isAdmin) {
      alert("⛔ Access Denied! Only Admin can add equipment.");
      navigate(-1);
    }
  }, [isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Image too large! Maximum 5MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Equipment name is required";
    if (!formData.code.trim()) newErrors.code = "Equipment code is required";
    if (!formData.quantity || formData.quantity < 0) newErrors.quantity = "Valid quantity is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ حفظ في MongoDB عبر API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/dept-equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deptCode,
          listId,
          name: formData.name,
          code: formData.code,
          quantity: parseInt(formData.quantity),
          status: formData.status,
          notes: formData.notes,
          image: formData.image || null
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Equipment added successfully!");
        navigate(`/department/${deptCode}/list/${listId}`, {
          state: {
            listName: listName,
            deptName: location.state?.deptName,
            isAdmin: true
          }
        });
      } else {
        alert("Failed to add equipment: " + data.message);
      }
    } catch (err) {
      console.error("Error adding equipment:", err);
      alert("Server connection error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "30px", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: "28px", marginBottom: "10px", color: "#1f2937" }}>➕ Add New Equipment</h1>
      <p style={{ marginBottom: "30px", color: "#6b7280" }}>List: <strong>{listName}</strong></p>

      <div style={{
        marginBottom: "20px", padding: "10px", background: "#d1fae5",
        borderRadius: "8px", textAlign: "center"
      }}>
        <span style={{ color: "#065f46", fontSize: "14px", fontWeight: "600" }}>
          👑 Admin Mode - You can add equipment
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>📷 Equipment Image</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
            {!imagePreview ? (
              <>
                <button type="button" onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, padding: '12px', border: '2px dashed #2563EB', borderRadius: '8px', background: '#f0f7ff', cursor: 'pointer', fontSize: '14px' }}>
                  📸 Take Photo
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', border: '2px dashed #6b7280', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', fontSize: '14px' }}>
                  📁 Upload File
                </button>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '150px' }} />
                <button type="button" onClick={removeImage} style={{ display: 'block', margin: '10px auto', color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✕ Remove Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>🔧 Equipment Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter equipment name"
            style={{ width: "100%", padding: "12px", border: errors.name ? "2px solid #ef4444" : "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }} />
          {errors.name && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.name}</span>}
        </div>

        {/* Code */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>🔢 Equipment Code *</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Enter unique code"
            style={{ width: "100%", padding: "12px", border: errors.code ? "2px solid #ef4444" : "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }} />
          {errors.code && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.code}</span>}
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>📦 Quantity *</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Enter quantity"
            style={{ width: "100%", padding: "12px", border: errors.quantity ? "2px solid #ef4444" : "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }} />
          {errors.quantity && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.quantity}</span>}
        </div>

        {/* Status */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>⚡ Status</label>
          <select name="status" value={formData.status} onChange={handleChange}
            style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>📝 Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Additional notes..."
            style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", resize: "vertical" }}></textarea>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button type="submit" disabled={isSubmitting}
            style={{ flex: 1, padding: "14px", background: "#2563EB", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
            {isSubmitting ? "⏳ Adding..." : "✅ Add Equipment"}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            style={{ flex: 1, padding: "14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddDepartmentEquipment;