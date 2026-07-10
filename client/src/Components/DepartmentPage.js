import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function DepartmentPage() {
  const { deptName } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE_URL = `http://${window.location.hostname}:5000/api/equipment`;

  useEffect(() => {
    if (deptName) {
      fetchEquipment();
    }
  }, [deptName]);

  useEffect(() => {
    const filtered = equipment.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEquipment(filtered);
  }, [searchTerm, equipment]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?category=${encodeURIComponent(deptName)}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
        setFilteredEquipment(data.data || []);
      } else {
        console.error("Failed to fetch equipment");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching equipment:", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this equipment?`)) {
      try {
        setDeletingId(id);
        const response = await fetch(`${API_BASE_URL}/${id}`, { 
          method: "DELETE" 
        });
        if (response.ok) {
          setEquipment(prev => prev.filter(item => item._id !== id));
          setFilteredEquipment(prev => prev.filter(item => item._id !== id));
          alert("Deleted successfully ✅");
        } else {
          throw new Error("Failed to delete");
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("Error deleting: " + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/EditEquipment/${id}`);
  };

 const handleAddEquipment = () => {
  navigate(`/AddEquipment/${encodeURIComponent(deptName)}`, {
    state: {
      deptName: deptName
    }
  });
};

  const openImageModal = (image) => {
    setSelectedImage(image);
    document.body.style.overflow = "hidden";
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <div style={{ width: "50px", height: "50px", border: "4px solid #f3f4f6", borderTop: "4px solid #2563EB", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
        <p>Loading {deptName} equipment...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate("/OTDepartment")} 
        style={{ 
          marginBottom: "20px", 
          padding: "10px 20px", 
          background: "#f8fafc", 
          border: "1px solid #e2e8f0", 
          borderRadius: "8px", 
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        ← Back to Departments
      </button>

      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h1 style={{ fontSize: "32px", color: "#1e293b", margin: 0 }}>
            {deptName}
          </h1>
          <p style={{ color: "#64748b", margin: "5px 0 0 0" }}>
            Manage medical equipment
          </p>
        </div>
       <button 
  onClick={handleAddEquipment}
  style={{
    display: "flex", 
    alignItems: "center", 
    gap: "8px",
    background: "#2563EB",
    color: "white", 
    border: "none",
    padding: "12px 24px", 
    borderRadius: "8px", 
    cursor: "pointer"
  }}
>
  + Add New Equipment
</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%", 
            padding: "12px 16px", 
            border: "1px solid #e2e8f0",
            borderRadius: "8px", 
            fontSize: "14px"
          }}
        />
        <div style={{ marginTop: "8px", color: "#64748b", fontSize: "12px" }}>
          {filteredEquipment.length} of {equipment.length} items
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Image</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Code</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Quantity</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                  {searchTerm ? "No results found" : `No equipment in ${deptName} yet`}
                  <br />
                  {!searchTerm && (
                    <button 
                      onClick={handleAddEquipment}
                      style={{
                        marginTop: "16px",
                        padding: "8px 20px",
                        background: "#2563EB",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      + Add First Equipment
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredEquipment.map((item) => (
                <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px" }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} 
                        onClick={() => openImageModal(item.image)}
                      />
                    ) : (
                      <div style={{ width: "50px", height: "50px", background: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>📷</div>
                    )}
                  </td>
                  <td style={{ padding: "12px", fontWeight: "500" }}>{item.name}</td>
                  <td style={{ padding: "12px" }}>
                    <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      {item.code || "N/A"}
                    </code>
                  </td>
                  <td style={{ padding: "12px" }}>{item.quantity || 0}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: item.status === "Available" ? "#d1fae5" : item.status === "In Use" ? "#fed7aa" : "#fee2e2",
                      color: item.status === "Available" ? "#065f46" : item.status === "In Use" ? "#92400e" : "#991b1b"
                    }}>
                      {item.status || "Available"}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button 
                      onClick={() => handleEdit(item._id)}
                      style={{
                        padding: "6px 12px",
                        background: "#10B981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "8px",
                        fontSize: "12px"
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: deletingId === item._id ? "not-allowed" : "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {deletingId === item._id ? "..." : "🗑️ Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
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
            zIndex: 10000
          }}
          onClick={closeImageModal}
        >
          <img src={selectedImage} alt="Full size" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }} />
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default DepartmentPage;