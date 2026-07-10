// Components/EditDepartmentEquipment.js
import React, { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:5000/api`;

function EditDepartmentEquipment() {
  const navigate = useNavigate();
  const { deptCode, listId, equipId } = useParams();
  const location = useLocation();

  const listName = location.state?.listName || "Equipment List";
  const deptName = location.state?.deptName || "";
  // ✅ البيانات تجي مباشرة من الـ state - بدون API
  const eq = location.state?.equipmentData || {};

  const [formData, setFormData] = useState({
    name:     eq.name     || "",
    code:     eq.code     || "",
    quantity: eq.quantity || "",
    status:   eq.status   || "Available",
    notes:    eq.notes    || "",
    image:    eq.image    || null
  });
  const [imagePreview, setImagePreview] = useState(eq.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const statuses = ["Available", "In Use", "Under Maintenance", "Retired"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (e) => {
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
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.code.trim()) newErrors.code = "Code required";
    if (formData.quantity === "" || formData.quantity < 0) newErrors.quantity = "Invalid quantity";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/dept-equipment/${equipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        alert("✅ Equipment updated successfully!");
        navigate(`/department/${deptCode}/list/${listId}`, {
          state: { listName, deptName, isAdmin: true }
        });
      } else {
        alert("Failed to update: " + data.message);
      }
    } catch (err) {
      alert("Server connection error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "30px", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: "28px", marginBottom: "10px", color: "#1f2937" }}>✏️ Edit Equipment</h1>
      <p style={{ marginBottom: "30px", color: "#6b7280" }}>List: <strong>{listName}</strong></p>

      <form onSubmit={handleSubmit}>

        {/* Image */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>📷 Equipment Image</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />

          {!imagePreview ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => cameraInputRef.current?.click()}
                style={{ flex: 1, padding: '12px', border: '2px dashed #2563EB', borderRadius: '8px', background: '#f0f7ff', cursor: 'pointer', fontSize: '14px' }}>
                📸 Take Photo
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, padding: '12px', border: '2px dashed #6b7280', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', fontSize: '14px' }}>
                📁 Upload File
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '150px' }} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  Change Photo
                </button>
                <button type="button" onClick={removeImage}
                  style={{ padding: '6px 12px', color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>🔧 Equipment Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange}
            style={{ width: "100%", padding: "12px", border: errors.name ? "2px solid #ef4444" : "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }} />
          {errors.name && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.name}</span>}
        </div>

        {/* Code */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>🔢 Equipment Code *</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange}
            style={{ width: "100%", padding: "12px", border: errors.code ? "2px solid #ef4444" : "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }} />
          {errors.code && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.code}</span>}
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>📦 Quantity *</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
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
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"
            style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", resize: "vertical" }}></textarea>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button type="submit" disabled={isSubmitting}
            style={{ flex: 1, padding: "14px", background: "#2563EB", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
            {isSubmitting ? "⏳ Updating..." : "✅ Update Equipment"}
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

export default EditDepartmentEquipment;