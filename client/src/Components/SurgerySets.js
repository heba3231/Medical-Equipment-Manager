// Components/SurgerySets.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:5000/api`;

function SurgerySets() {
  const { surgeryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const surgeryName = location.state?.surgeryName || "Surgery";

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSet, setNewSet] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  useEffect(() => {
    fetchSets();
  }, [surgeryId]);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/ot/sets/${surgeryId}`);
      const data = await res.json();
      if (data.success) setSets(data.data);
    } catch (err) {
      console.error("Error fetching sets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = async () => {
    if (!newSet.name.trim()) return alert("Please enter set name");

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/ot/sets/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSet)
        });
        const data = await res.json();
        if (data.success) {
          setSets(prev => prev.map(s => s._id === editingId ? { ...s, ...newSet } : s));
          setEditingId(null);
        }
      } else {
        const res = await fetch(`${API_BASE}/ot/sets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surgeryId, ...newSet })
        });
        const data = await res.json();
        if (data.success) setSets(prev => [...prev, data.data]);
      }
      setNewSet({ name: "", description: "" });
    } catch (err) {
      alert("Error saving set: " + err.message);
    }
  };

  const handleEdit = (set) => {
    setNewSet({ name: set.name, description: set.description || "" });
    setEditingId(set._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All equipment in this set will be deleted!`)) return;
    try {
      const res = await fetch(`${API_BASE}/ot/sets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setSets(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert("Error deleting set");
    }
  };

  const handleSetClick = (set) => {
    navigate(`/ot/set/${set._id}`, {
      state: { setName: set.name, surgeryName: surgeryName }
    });
  };

  if (loading) {
    return (
      <div className="ot-loading">
        <div className="ot-spinner"></div>
        <p>Loading equipment sets...</p>
      </div>
    );
  }

  return (
    <div className="ot-container">
      <div className="ot-content ot-content-small">
        
        <button className="ot-back-btn" onClick={() => navigate("/ot")}>
          ← Back to Surgery Types
        </button>

        <div className="ot-header">
          <h1 className="ot-title">🔧 {surgeryName} - Equipment Sets</h1>
          <p className="ot-subtitle">Each set contains a collection of equipment for specific procedures</p>
        </div>

        {isAdmin && (
          <div className="ot-form-card">
            <h3 className="ot-form-title">
              {editingId ? "✏️ Edit Set" : "➕ Add New Equipment Set"}
            </h3>
            <div className="ot-form-group">
              <input
                type="text"
                placeholder="Set name (e.g., Knee Surgery Set)"
                value={newSet.name}
                onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
                className="ot-input"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newSet.description}
                onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
                className="ot-input"
              />
              <div className="ot-form-btns">
                <button onClick={handleAddSet} className="ot-btn-primary">
                  {editingId ? "Update" : "Add"}
                </button>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setNewSet({ name: "", description: "" }); }} className="ot-btn-cancel">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {sets.length === 0 ? (
          <div className="ot-empty-state">
            <div className="ot-empty-icon">📦</div>
            <p>No equipment sets added yet</p>
            {isAdmin && <p className="ot-empty-hint">Click "Add New Equipment Set" to get started</p>}
          </div>
        ) : (
          <div className="ot-surgery-list">
            {sets.map((set) => (
              <div
                key={set._id}
                className="ot-surgery-card"
                onClick={() => handleSetClick(set)}
              >
                <div className="ot-surgery-info">
                  <div className="ot-surgery-name">📋 {set.name}</div>
                  {set.description && (
                    <div className="ot-surgery-desc">{set.description}</div>
                  )}
                </div>
                <div className="ot-surgery-actions">
                  <span className="ot-arrow">→</span>
                  {isAdmin && (
                    <div className="ot-action-btns" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEdit(set)} className="ot-edit-btn">Edit</button>
                      <button onClick={() => handleDelete(set._id, set.name)} className="ot-delete-btn">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SurgerySets;