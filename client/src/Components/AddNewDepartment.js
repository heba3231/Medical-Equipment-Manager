import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddNewDepartment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/custom-departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert("✅ Department added successfully!");
        navigate("/");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to add department");
      }
    } catch (err) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "500px", margin: "50px auto", padding: "40px", 
      background: "white", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ textAlign: "center", color: "#10B981", fontSize: "32px", marginBottom: "10px" }}>
        ➕ Add New Department
      </h1>
      <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "30px" }}>
        Enter the new department name and it will appear on the home page
      </p>

      {error && (
        <div style={{
          background: "#fee2e2", color: "#dc2626", padding: "15px", 
          borderRadius: "10px", marginBottom: "20px", borderLeft: "4px solid #dc2626"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Department Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Cardiology, Orthopedics, Dermatology"
            style={{
              width: "100%", padding: "15px", border: "2px solid #e5e7eb", 
              borderRadius: "12px", fontSize: "16px", transition: "border-color 0.3s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#10B981"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the department"
            rows="3"
            style={{
              width: "100%", padding: "15px", border: "2px solid #e5e7eb", 
              borderRadius: "12px", fontSize: "16px", resize: "vertical"
            }}
            onFocus={(e) => e.target.style.borderColor = "#10B981"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1, padding: "16px", background: "#10B981", color: "white",
              border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "⏳ Adding..." : "✅ Add Department"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              flex: 1, padding: "16px", background: "#f3f4f6", color: "#374151",
              border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Back
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddNewDepartment;