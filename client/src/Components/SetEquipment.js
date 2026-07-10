// Components/SetEquipment.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:5000/api`;

function SetEquipment() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const setName = location.state?.setName || "Equipment Set";
  const surgeryName = location.state?.surgeryName || "";

  const [equipment, setEquipment] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  useEffect(() => {
    fetchEquipment();
  }, [setId]);

  useEffect(() => {
    if (!search) setFiltered(equipment);
    else {
      const lower = search.toLowerCase();
      setFiltered(equipment.filter(item =>
        item.name?.toLowerCase().includes(lower) ||
        item.code?.toLowerCase().includes(lower)
      ));
    }
  }, [search, equipment]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/ot/equipment/${setId}`);
      const data = await res.json();
      if (data.success) {
        setEquipment(data.data);
        setFiltered(data.data);
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) { alert("Only Admin can delete equipment"); return; }
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    try {
      const res = await fetch(`${API_BASE}/ot/equipment/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEquipment(prev => prev.filter(eq => eq._id !== id));
        alert("✅ Equipment deleted!");
      }
    } catch (err) {
      alert("Error deleting equipment");
    }
  };

  const handleAdd = () => {
    if (!isAdmin) { alert("Only Admin can add equipment"); return; }
    navigate(`/ot/set/${setId}/add`, { state: { setId, setName, surgeryName } });
  };

  const handleEdit = (item) => {
    if (!isAdmin) { alert("Only Admin can edit equipment"); return; }
    navigate(`/ot/set/${setId}/edit/${item._id}`, {
      state: { setId, setName, surgeryName, equipmentData: item }
    });
  };

  if (loading) {
    return (
      <div className="ot-loading">
        <div className="ot-spinner"></div>
        <p>Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="ot-equipment-container">
      <button className="ot-equipment-back" onClick={() => navigate(-1)}>
        ← Back to Sets
      </button>

      <div className="ot-equipment-header">
        <div>
          <h1 className="ot-equipment-title">{setName}</h1>
          <p className="ot-equipment-subtitle">
            {surgeryName} - {isAdmin ? "Manage equipment" : "View equipment"}
          </p>
          <span className={`ot-role-badge ${isAdmin ? 'admin' : 'staff'}`}>
            {isAdmin ? "👑 Admin Mode - Full Access" : "👁️ Staff Mode - View Only"}
          </span>
        </div>

        {isAdmin && (
          <button onClick={handleAdd} className="ot-add-btn">
            + Add New Equipment
          </button>
        )}
      </div>

      <div className="ot-search-box">
        <input
          type="text"
          placeholder="🔍 Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ot-search-input"
        />
        <div className="ot-search-count">
          📊 {filtered.length} / {equipment.length} items
        </div>
      </div>

      {equipment.length === 0 ? (
        <div className="ot-equipment-empty">
          <div className="ot-empty-icon">🔧</div>
          <h2>No Equipment Yet</h2>
          <p>{isAdmin ? "Click the button above to add your first equipment" : "No equipment has been added by Admin yet"}</p>
        </div>
      ) : (
        <div className="ot-table-wrapper">
          <table className="ot-equipment-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Code</th>
                <th>Quantity</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id}>
                  <td className="ot-image-cell">
                    {item.image ? (
                      <img
                        src={item.image}
                        className="ot-equipment-img"
                        onClick={() => setImageModal(item.image)}
                        alt={item.name}
                      />
                    ) : (
                      <div className="ot-no-image">📷</div>
                    )}
                  </td>
                  <td className="ot-name-cell">{item.name}</td>
                  <td className="ot-code-cell">{item.code || "—"}</td>
                  <td className="ot-qty-cell">{item.quantity || 0}</td>
                  <td>
                    <span className={`ot-status-badge ${item.status?.toLowerCase().replace(/\s/g, '-') || 'available'}`}>
                      {item.status || "Available"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="ot-actions-cell">
                      <button onClick={() => handleEdit(item)} className="ot-icon-btn" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(item._id)} className="ot-icon-btn" title="Delete">🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {imageModal && (
        <div className="ot-image-modal" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Equipment" className="ot-modal-img" />
        </div>
      )}
    </div>
  );
}

export default SetEquipment;