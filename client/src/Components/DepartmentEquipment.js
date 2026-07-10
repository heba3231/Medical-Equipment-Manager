// Components/DepartmentEquipment.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

function DepartmentEquipment() {
  const { deptCode, listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // التحقق من وضع الباركود
  const queryParams = new URLSearchParams(location.search);
  const isSimpleView = queryParams.get("view") === "simple";

  const isAdmin = location.state?.isAdmin || localStorage.getItem("userRole") === "admin";
  const listName = location.state?.listName || "Equipment List";
  const deptName = location.state?.deptName || `${deptCode} Department`;

  const [equipment, setEquipment] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [serverIP, setServerIP] = useState(window.location.hostname);

  const currentPort = window.location.port ? `:${window.location.port}` : "";
  const equipmentViewUrl = `${window.location.protocol}//${serverIP}${currentPort}/department/${deptCode}/list/${listId}?view=simple`;

  useEffect(() => {
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      setServerIP('192.168.8.93');
    } else {
      setServerIP(currentHostname);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [deptCode, listId]);

  useEffect(() => {
    if (!search) {
      setFiltered(equipment);
    } else {
      const lower = search.toLowerCase();
      setFiltered(equipment.filter(item =>
        item.name?.toLowerCase().includes(lower) ||
        (item.code && item.code.toLowerCase().includes(lower))
      ));
    }
  }, [search, equipment]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dept-equipment/${deptCode}/${listId}`);
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
    if (!isAdmin) {
      alert("Only Admin can delete equipment");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    try {
      const res = await fetch(`${API_BASE}/dept-equipment/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEquipment(prev => prev.filter(eq => eq._id !== id));
        alert("✅ Equipment deleted!");
      }
    } catch (err) {
      alert("Error deleting equipment");
    }
  };

  const handleEdit = (item) => {
    if (!isAdmin) {
      alert("Only Admin can edit equipment");
      return;
    }
    navigate(`/department/${deptCode}/list/${listId}/edit/${item._id}`, {
      state: {
        listId,
        listName,
        deptCode,
        deptName,
        isAdmin,
        equipmentData: item
      }
    });
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert("Only Admin can add equipment");
      return;
    }
    navigate(`/department/${deptCode}/list/${listId}/add`, {
      state: { listId, listName, deptCode, deptName, isAdmin }
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  // ============================================================
  // 🟢 وضع المسح (الجدول فقط) - يظهر عند مسح الباركود
  // ============================================================
  if (isSimpleView) {
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#fff', 
        maxWidth: '900px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: '20px'
      }}>
        <h3 style={{ textAlign: 'center', color: '#006341', marginBottom: '5px', fontSize: '20px' }}>{listName}</h3>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '-5px', marginBottom: '15px' }}>
          {deptName} • {equipment.length} items
        </p>
        
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #d0e8dc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #d0e8dc' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Image</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        style={{ 
                          width: '45px', 
                          height: '45px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '1px solid #e5e7eb'
                        }}
                        onClick={() => setImageModal(item.image)}
                        alt={item.name}
                      />
                    ) : (
                      <div style={{ 
                        width: '45px', 
                        height: '45px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '20px',
                        border: '1px solid #e5e7eb'
                      }}>
                        📷
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#666' }}>{item.code || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity || 0}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      fontSize: '10px', padding: '3px 10px', borderRadius: '12px',
                      backgroundColor: item.status === 'Available' ? '#d1fae5' : 
                                     item.status === 'In Use' ? '#dbeafe' : 
                                     item.status === 'Under Maintenance' ? '#fed7aa' : '#fee2e2',
                      color: item.status === 'Available' ? '#065f46' : 
                             item.status === 'In Use' ? '#1e40af' : 
                             item.status === 'Under Maintenance' ? '#92400e' : '#991b1b'
                    }}>
                      {item.status || 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', color: '#ccc' }}>
          📱 Scanned from QR Code • Internal Asset List • {deptName}
        </div>

        {/* Image Modal للعرض المبسط */}
        {imageModal && (
          <div
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

  // ============================================================
  // 🔵 الوضع الطبيعي (الصفحة الكاملة) - يظهر للأدمن والموظف داخل النظام
  // ============================================================
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(`/department/${deptCode}`)}
        style={{
          background: 'none', border: 'none', color: '#006341',
          fontSize: '14px', cursor: 'pointer', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        ← Back to Lists
      </button>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', color: '#1f2937', margin: 0 }}>{listName}</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>{deptName}</p>
          <span style={{
            display: 'inline-block', marginTop: '5px', padding: '4px 12px',
            borderRadius: '20px', fontSize: '11px', fontWeight: '600',
            backgroundColor: isAdmin ? '#d1fae5' : '#fef3c7',
            color: isAdmin ? '#065f46' : '#92400e'
          }}>
            {isAdmin ? "👑 Admin Mode" : "👁️ Staff Mode"}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ✅ QR Code - مكبر وواضح */}
          <div 
            onClick={() => setShowQRModal(true)}
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              padding: '10px',
              borderRadius: '12px',
              border: '2px solid #006341',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(0,99,65,0.1)',
              minWidth: '100px'
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
              value={equipmentViewUrl} 
              size={90}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#006341"
            />
            <div style={{ 
              fontSize: '10px', 
              color: '#006341', 
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.3px'
            }}>
              📱 Scan Me
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#006341', color: 'white',
                border: 'none', borderRadius: '8px', padding: '10px 20px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search by name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', marginBottom: '20px',
          borderRadius: '10px', border: '2px solid #d0e8dc', fontSize: '14px'
        }}
      />

      {/* Equipment Table */}
      {equipment.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', borderRadius: '16px' }}>
          <p style={{ color: '#6b7280' }}>No equipment in this list yet.</p>
          {isAdmin && (
            <button onClick={handleAdd} style={{ marginTop: '10px', padding: '10px 20px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              + Add First Equipment
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #d0e8dc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #d0e8dc' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Image</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                {isAdmin && <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => setImageModal(item.image)}
                        alt={item.name}
                      />
                    ) : (
                      <div style={{ width: '45px', height: '45px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📷</div>
                    )}
                  </td>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {item.code || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity || 0}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: item.status === 'Available' ? '#d1fae5' : 
                                     item.status === 'In Use' ? '#dbeafe' : 
                                     item.status === 'Under Maintenance' ? '#fed7aa' : '#fee2e2',
                      color: item.status === 'Available' ? '#065f46' : 
                             item.status === 'In Use' ? '#1e40af' : 
                             item.status === 'Under Maintenance' ? '#92400e' : '#991b1b'
                    }}>
                      {item.status || 'Available'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', marginRight: '8px' }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal - نافذة الباركود الكبيرة */}
      {showQRModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: 'white', padding: '40px', borderRadius: '20px',
              textAlign: 'center', maxWidth: '90%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ✕
            </button>
            
            <h3 style={{ marginBottom: '5px', color: '#004d32', clear: 'both' }}>📋 {listName}</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
              {deptName} • Scan this QR to view equipment list only
            </p>
            
            <QRCodeCanvas 
              value={equipmentViewUrl} 
              size={280}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#006341"
            />
            
            <p style={{ fontSize: '11px', color: '#999', marginTop: '15px', wordBreak: 'break-all' }}>
              {equipmentViewUrl}
            </p>
            
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                marginTop: '15px', padding: '8px 30px',
                background: '#006341', color: 'white',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
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

export default DepartmentEquipment;