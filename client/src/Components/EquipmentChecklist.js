// Components/EquipmentChecklist.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:5000/api`;

function EquipmentChecklist() {
  const { deptCode, listId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const listName = location.state?.listName || "Equipment List";
  const deptName = location.state?.deptName || deptCode || "Department";

  const [equipment, setEquipment] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (!listId) {
      setError("No list ID provided");
      setLoading(false);
      return;
    }
    fetchEquipment();
    fetchSavedChecklist();
  }, [listId]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`${API_BASE}/dept-equipment/list/${listId}`);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.data);
        const initialChecked = {};
        data.data.forEach(item => {
          const id = item._id.toString();
          initialChecked[id] = false;
        });
        setCheckedItems(initialChecked);
      } else {
        setError(data.message || "Failed to fetch equipment");
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE}/checklist/${listId}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.checkedItems) {
        setCheckedItems(data.data.checkedItems);
        setSubmitted(data.data.submitted || false);
        setSubmissionData(data.data);
      }
    } catch (err) {
      console.error('Error fetching saved checklist:', err);
    }
  };

  // ✅ دالة معالجة الضغط على checkbox
  const handleCheck = (itemId) => {
    if (submitted) {
      alert("This checklist has already been submitted. Cannot make changes.");
      return;
    }
    
    console.log("Toggling checkbox for:", itemId);
    setCheckedItems(prev => {
      const newValue = !prev[itemId];
      console.log(`Item ${itemId} changed from ${prev[itemId]} to ${newValue}`);
      return {
        ...prev,
        [itemId]: newValue
      };
    });
  };

  const handleSelectAll = () => {
    if (submitted) {
      alert("This checklist has already been submitted. Cannot make changes.");
      return;
    }
    const allChecked = {};
    equipment.forEach(item => {
      const id = item._id.toString();
      allChecked[id] = true;
    });
    setCheckedItems(allChecked);
  };

  const handleClearAll = () => {
    if (submitted) {
      alert("This checklist has already been submitted. Cannot make changes.");
      return;
    }
    const allUnchecked = {};
    equipment.forEach(item => {
      const id = item._id.toString();
      allUnchecked[id] = false;
    });
    setCheckedItems(allUnchecked);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const userName = localStorage.getItem("userName") || 
                       JSON.parse(localStorage.getItem("user") || "{}")?.name || 
                       "Staff";
      const userRole = localStorage.getItem("userRole") || "staff";
      
      const payload = {
        listId,
        deptCode,
        listName,
        checkedItems,
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy: userName,
        userRole: userRole
      };
      
      console.log("Submitting checklist:", payload);
      
      const response = await fetch(`${API_BASE}/checklist/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setSubmissionData(data.data);
        alert('✅ Checklist submitted successfully!');
        // ✅ بعد التأكيد، تذهب إلى صفحة العمليات
        navigate('/ot-enhanced');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      console.error('Error saving checklist:', err);
      alert('Error saving checklist: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Equipment Checklist - ${listName}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #006341;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #004d32;
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            color: #006341;
            margin: 10px 0 5px;
            font-size: 18px;
          }
          .header p {
            color: #6a8a7a;
            margin: 5px 0;
            font-size: 14px;
          }
          .submitted-info {
            background: #d1fae5;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f0f7f4;
            color: #004d32;
            font-weight: 600;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-available { background: #d1fae5; color: #065f46; }
          .status-in-use { background: #dbeafe; color: #1e40af; }
          .status-under-maintenance { background: #fed7aa; color: #92400e; }
          .status-retired { background: #fee2e2; color: #991b1b; }
          .checked-mark {
            color: #006341;
            font-weight: bold;
            margin-left: 8px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Available': 'status-available',
      'In Use': 'status-in-use',
      'Under Maintenance': 'status-under-maintenance',
      'Retired': 'status-retired'
    };
    return statusMap[status] || 'status-available';
  };

  const checkedCount = Object.values(checkedItems).filter(v => v === true).length;
  const totalCount = equipment.length;
  const completionPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Error</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => window.history.back()} 
          style={{ padding: '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5ede9', borderTop: '3px solid #006341', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
        <p>Loading checklist...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
        <h2 style={{ color: '#004d32', marginBottom: '10px' }}>No Equipment Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          This list has no equipment items yet. Please ask the admin to add equipment to this list.
        </p>
        <button 
          onClick={() => window.history.back()} 
          style={{ padding: '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with buttons */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'none', border: 'none', color: '#006341',
              fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            ← Back
          </button>
          
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#c9a84c', color: '#004d32',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600'
            }}
          >
            🖨️ Print Checklist
          </button>
        </div>
        
        <div style={{ borderBottom: '2px solid #d0e8dc', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', color: '#004d32', margin: '0 0 8px 0' }}>
            📋 Equipment Checklist
          </h1>
          <h2 style={{ fontSize: '20px', color: '#006341', margin: '0 0 8px 0' }}>{listName}</h2>
          <p style={{ color: '#6a8a7a', margin: 0 }}>Department: {deptName || deptCode}</p>
          {submitted && submissionData && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', fontSize: '14px' }}>
              ✅ Already submitted on: {new Date(submissionData.submittedAt).toLocaleString()} by {submissionData.submittedBy}
            </div>
          )}
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Print Header (only visible in print) */}
        <div className="print-header" style={{ display: 'none' }}>
          <div className="header">
            <h1>📋 Equipment Checklist</h1>
            <h2>{listName}</h2>
            <p>Department: {deptName || deptCode}</p>
            {submissionData && (
              <div className="submitted-info">
                <p>✅ Submitted on: {new Date(submissionData.submittedAt).toLocaleString()}</p>
                <p>👤 Submitted by: {submissionData.submittedBy}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls (only show if not submitted) */}
        {!submitted && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleSelectAll} 
              style={{ padding: '10px 20px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              ✓ Select All
            </button>
            <button 
              onClick={handleClearAll} 
              style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              ✗ Clear All
            </button>
          </div>
        )}

        {/* Progress Bar (only show if not submitted) */}
        {!submitted && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
              <span>📊 Progress: {checkedCount} / {totalCount} items checked</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completionPercentage}%`, background: '#006341', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        )}

        {/* Equipment Table */}
        <div style={{ overflowX: 'auto', marginBottom: '24px', borderRadius: '12px', border: '1px solid #d0e8dc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #d0e8dc' }}>
                <th style={{ width: '50px', padding: '16px', textAlign: 'center' }}>✓</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Image</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Equipment Name</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Quantity</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => {
                const itemId = item._id.toString();
                const isChecked = checkedItems[itemId] || false;
                
                return (
                  <tr key={itemId} style={{ borderBottom: '1px solid #e5e7eb', background: isChecked ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheck(itemId)}
                        disabled={submitted}
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          cursor: submitted ? 'not-allowed' : 'pointer',
                          transform: 'scale(1.2)'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📷</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      {item.name}
                      {isChecked && <span style={{ color: '#006341', marginLeft: '8px', fontWeight: 'bold' }}>✓</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{item.code || '—'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity || 0}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        background: item.status === 'Available' ? '#d1fae5' : item.status === 'In Use' ? '#fed7aa' : item.status === 'Under Maintenance' ? '#fee2e2' : '#fef3c7',
                        color: item.status === 'Available' ? '#065f46' : item.status === 'In Use' ? '#92400e' : item.status === 'Under Maintenance' ? '#991b1b' : '#92400e'
                      }}>
                        {item.status || 'Available'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#006341' }}>{checkedCount}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Checked</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7280' }}>{totalCount - checkedCount}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Remaining</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#006341' }}>{totalCount}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              style={{ 
                padding: '12px 32px', 
                background: '#006341', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? '⏳ Submitting...' : '✅ Submit & Confirm'}
            </button>
          </div>
        )}

        {/* Submitted Message */}
        {submitted && submissionData && (
          <div style={{ marginTop: '20px', textAlign: 'center', padding: '16px', background: '#d1fae5', borderRadius: '10px', color: '#065f46' }}>
            <p>✅ This checklist has been confirmed and submitted to OT Department.</p>
            <p>📅 Submitted on: {new Date(submissionData.submittedAt).toLocaleString()}</p>
            <p>👤 Submitted by: {submissionData.submittedBy}</p>
            <button 
              onClick={() => navigate('/ot-enhanced')}
              style={{ marginTop: '12px', padding: '8px 20px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Go to OT Department →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentChecklist;