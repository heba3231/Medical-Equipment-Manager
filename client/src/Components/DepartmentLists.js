// Components/DepartmentLists.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:5000/api`;

function DepartmentLists() {
  const { deptCode } = useParams();
  const navigate = useNavigate();

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";
  const userName = localStorage.getItem("userName") || "Staff";

  const [items, setItems] = useState([]);
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const departmentNames = {
    AE: "A/E Department", OT: "OT Department", ICU: "ICU Department",
    Surgery: "Surgery Department", Emergency: "Emergency Department",
    Radiology: "Radiology Department", Laboratory: "Laboratory Department",
    Pharmacy: "Pharmacy Department", ANC: "A.N.C Department",
    ENT: "E.N.T Department", FSW: "F.S.W Department", FMW: "F.M.W Department",
    LCU: "L.C.U Department", MATB: "MAT.B Department", MMW: "M.M.W Department",
    MOT: "M.OT Department", MSW: "M.S.W Department", ORTH: "ORTH Department",
    PAEDA: "PAED.A Department", RDU: "R.D.U Department", SOPD: "S.OPD Department",
  };

  const displayName = departmentNames[deptCode] || `${deptCode} Department`;

  useEffect(() => {
    fetchLists();
  }, [deptCode]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dept-lists/${deptCode}`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error("Error fetching lists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!listName.trim()) return alert("Please enter a list name");

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/dept-lists/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: listName.trim(), description })
        });
        const data = await res.json();
        if (data.success) {
          setItems(prev => prev.map(i => i._id === editingId
            ? { ...i, name: listName.trim(), description }
            : i
          ));
          setEditingId(null);
        }
      } else {
        const res = await fetch(`${API_BASE}/dept-lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deptCode, name: listName.trim(), description })
        });
        const data = await res.json();
        if (data.success) {
          setItems(prev => [...prev, data.data]);
        }
      }
      setListName("");
      setDescription("");
    } catch (err) {
      console.error("Error saving list:", err);
      alert("Server connection error");
    }
  };

  const handleEdit = (item) => {
    setListName(item.name);
    setDescription(item.description || "");
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All equipment in this list will be deleted!`)) return;
    try {
      const res = await fetch(`${API_BASE}/dept-lists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      alert("Error deleting list");
    }
  };

  // ✅ فتح القائمة لعرض الأدوات (للمدير والموظف)
  const handleOpenList = (item) => {
    navigate(`/department/${deptCode}/list/${item._id}`, {
      state: {
        listId: item._id,
        listName: item.name,
        deptCode,
        deptName: displayName,
        isAdmin,
      }
    });
  };

  // ✅ فتح صفحة Checklist (للموظف فقط)
  const handleOpenChecklist = (item) => {
    navigate(`/checklist/${deptCode}/${item._id}`, {
      state: {
        listId: item._id,
        listName: item.name,
        deptCode,
        deptName: displayName,
        readOnly: false
      }
    });
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
      Loading {displayName} lists...
    </div>
  );

  return (
    <div style={{ background: "#f5f5f0", minHeight: "100vh", padding: "0 0 60px" }}>
      <div style={{ padding: "28px 40px 0" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "#006341",
            fontSize: "14px", cursor: "pointer", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          ← Back to Home
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: "22px", fontWeight: "700", color: "#006341",
            borderBottom: "1.5px solid #d0d0c8", paddingBottom: "14px", margin: 0
          }}>
            {displayName} - Lists
          </h2>
          <span style={{
            padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
            background: isAdmin ? "#d1fae5" : "#fef3c7",
            color: isAdmin ? "#065f46" : "#92400e"
          }}>
            {isAdmin ? "👑 Admin Mode" : `👤 ${userName} - Staff Mode`}
          </span>
        </div>

        {/* FORM - للأدمن فقط */}
        {isAdmin && (
          <div style={{ maxWidth: "800px", marginBottom: "40px", background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h3 style={{ marginBottom: "16px", color: "#004d32" }}>
              {editingId ? "✏️ Edit List" : "➕ Create New List"}
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="List Name"
                value={listName}
                onChange={e => setListName(e.target.value)}
                style={{
                  width: "100%", padding: "12px", border: "1.5px solid #d0e8dc",
                  borderRadius: "10px", fontSize: "14px"
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                style={{
                  width: "100%", padding: "12px", border: "1.5px solid #d0e8dc",
                  borderRadius: "10px", fontSize: "14px", resize: "vertical"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleAddItem}
                style={{
                  background: "#006341", color: "white", border: "none",
                  borderRadius: "10px", padding: "10px 24px", cursor: "pointer"
                }}
              >
                {editingId ? "Update List" : "Add List"}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setListName(""); setDescription(""); }}
                  style={{ background: "#9ca3af", color: "white", border: "none", borderRadius: "10px", padding: "10px 24px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lists Grid */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <p>{isAdmin ? "No lists created yet. Click 'Add List' to get started." : "No lists available yet."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
            {items.map(item => (
              <div key={item._id} style={{
                background: "white", borderRadius: "16px", border: "1px solid #d0e8dc",
                overflow: "hidden", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                {/* Card Header */}
                <div style={{ padding: "16px", borderBottom: "1px solid #e5ede9", background: "#fafdfb" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#004d32" }}>{item.name}</h3>
                  {item.description && <p style={{ margin: 0, fontSize: "13px", color: "#6a8a7a" }}>{item.description}</p>}
                </div>

                {/* Card Actions */}
                <div style={{ padding: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {/* View/Edit Equipment - للمدير والموظف */}
                  <button
                    onClick={() => handleOpenList(item)}
                    style={{
                      flex: 1, padding: "10px", background: "#006341", color: "white",
                      border: "none", borderRadius: "10px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    📋 View Equipment
                  </button>

                  {/* Open Checklist - للموظف والمدير على حد سواء */}
                  <button
                    onClick={() => handleOpenChecklist(item)}
                    style={{
                      flex: 1, padding: "10px", background: "#c9a84c", color: "#004d32",
                      border: "none", borderRadius: "10px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    ✓ Open Checklist
                  </button>

                  {/* Edit/Delete - للمدير فقط */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          padding: "10px 16px", background: "#e5e7eb", color: "#374151",
                          border: "none", borderRadius: "10px", cursor: "pointer"
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        style={{
                          padding: "10px 16px", background: "#fee2e2", color: "#dc2626",
                          border: "none", borderRadius: "10px", cursor: "pointer"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
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

export default DepartmentLists;