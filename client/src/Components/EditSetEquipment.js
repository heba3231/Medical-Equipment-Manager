// Components/EditSetEquipment.js
import React, { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:5000/api`;

function EditSetEquipment() {
  const navigate = useNavigate();
  const { setId, equipId } = useParams();
  const location = useLocation();

  const setName = location.state?.setName || "Equipment Set";
  const surgeryName = location.state?.surgeryName || "";
  const eq = location.state?.equipmentData || {};

  const [formData, setFormData] = useState({
    name: eq.name || "",
    code: eq.code || "",
    quantity: eq.quantity || "",
    status: eq.status || "Available",
    notes: eq.notes || "",
    image: eq.image || null
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
      const res = await fetch(`${API_BASE}/ot/equipment/${equipId}`, {
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
        navigate(`/ot/set/${setId}`, {
          state: { setName, surgeryName }
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
    <div className="ot-add-equipment">
      <button className="ot-add-back" onClick={() => navigate(-1)}>← Back</button>

      <h1 className="ot-add-title">✏️ Edit Equipment</h1>
      <p className="ot-add-subtitle">Set: <strong>{setName}</strong> | {surgeryName}</p>

      <form onSubmit={handleSubmit} className="ot-add-form">
        <div className="ot-image-upload">
          <label className="ot-label">📷 Equipment Image</label>
          <div className="ot-image-btns">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
            
            {!imagePreview ? (
              <>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="ot-camera-btn">📸 Take Photo</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="ot-upload-btn">📁 Upload File</button>
              </>
            ) : (
              <div className="ot-image-preview">
                <img src={imagePreview} alt="Preview" />
                <div className="ot-image-actions">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="ot-change-btn">Change Photo</button>
                  <button type="button" onClick={removeImage} className="ot-remove-img">Remove</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ot-form-field">
          <label className="ot-label">🔧 Equipment Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? "ot-input-error" : "ot-input"} />
          {errors.name && <span className="ot-error-text">{errors.name}</span>}
        </div>

        <div className="ot-form-field">
          <label className="ot-label">🔢 Equipment Code *</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} className={errors.code ? "ot-input-error" : "ot-input"} />
          {errors.code && <span className="ot-error-text">{errors.code}</span>}
        </div>

        <div className="ot-form-field">
          <label className="ot-label">📦 Quantity *</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={errors.quantity ? "ot-input-error" : "ot-input"} />
          {errors.quantity && <span className="ot-error-text">{errors.quantity}</span>}
        </div>

        <div className="ot-form-field">
          <label className="ot-label">⚡ Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="ot-select">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="ot-form-field">
          <label className="ot-label">📝 Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="ot-textarea"></textarea>
        </div>

        <div className="ot-form-buttons">
          <button type="submit" disabled={isSubmitting} className="ot-submit-btn">
            {isSubmitting ? "⏳ Updating..." : "✅ Update Equipment"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="ot-cancel-btn">
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSetEquipment;