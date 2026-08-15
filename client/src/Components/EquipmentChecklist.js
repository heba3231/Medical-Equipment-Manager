// Components/EquipmentChecklist.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:5000/api`;

// ✅ Hook للاستجابة (محسّن)
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

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

  const { width } = useWindowSize();
  // نقاط قطع أكثر دقة
  const isMobile = width < 640;
  const isTablet = width < 1024 && width >= 640;
  // حجم الخط الأساسي حسب الجهاز
  const baseFontSize = isMobile ? '12px' : isTablet ? '13px' : '14px';

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

  const handleCheck = (itemId) => {
    if (submitted) {
      alert("This checklist has already been submitted. Cannot make changes.");
      return;
    }
    
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
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

  // ===================== PRINT FUNCTION =====================
  const handlePrint = () => {
    const userName = localStorage.getItem("userName") || 
                     JSON.parse(localStorage.getItem("user") || "{}")?.name || 
                     "Unknown";
    const submittedByName = submissionData?.submittedBy || userName;

    let tableRows = equipment.map((item, index) => {
      const itemId = item._id.toString();
      const isChecked = checkedItems[itemId] || false;
      return `
        <tr>
          <td class="col-index">${index + 1}</td>
          <td class="col-name">${item.name || ''}</td>
          <td class="col-code">${item.code || '—'}</td>
          <td class="col-qty">${item.quantity || 0}</td>
          <td class="col-status">${item.status || 'Available'}</td>
          <td class="col-checked">${isChecked ? '✓' : ''}</td>
        </tr>
      `;
    }).join('');

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print Checklist</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; margin: 16mm 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1f2937; }
          .print-page { width: 100%; }
          .inspector-line {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 1.5px solid #004d32;
          }
          .inspector-label { font-size: 13px; font-weight: 700; color: #004d32; text-transform: uppercase; letter-spacing: 0.5px; }
          .inspector-name { font-size: 16px; font-weight: 700; color: #111827; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { background: #f0f7f4; color: #004d32; font-weight: 700; padding: 8px 6px; border: 1px solid #999; text-align: left; }
          tbody td { padding: 7px 6px; border: 1px solid #999; vertical-align: middle; }
          .col-index { text-align: center; width: 36px; }
          .col-name { text-align: left; }
          .col-code { text-align: left; width: 90px; }
          .col-qty { text-align: center; width: 60px; }
          .col-status { text-align: left; width: 110px; }
          .col-checked { text-align: center; width: 50px; font-weight: 700; }
          tbody tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="inspector-line">
            <span class="inspector-label">Inspector:</span>
            <span class="inspector-name">${submittedByName}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th class="col-name">Equipment Name</th>
                <th class="col-code">Code</th>
                <th class="col-qty">Qty</th>
                <th class="col-status">Status</th>
                <th class="col-checked">Checked</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => { printWindow.print(); };
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
      <div style={{ textAlign: 'center', padding: isMobile ? '30px' : '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#dc2626', marginBottom: '10px', fontSize: isMobile ? '18px' : '24px' }}>Error</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: baseFontSize }}>{error}</p>
        <button 
          onClick={() => window.history.back()} 
          style={{ padding: isMobile ? '8px 16px' : '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: baseFontSize }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '30px' : '60px' }}>
        <div style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px', border: '3px solid #e5ede9', borderTop: '3px solid #006341', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ fontSize: baseFontSize }}>Loading checklist...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '30px' : '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '20px' }}>📋</div>
        <h2 style={{ color: '#004d32', marginBottom: '10px', fontSize: isMobile ? '18px' : '24px' }}>No Equipment Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: baseFontSize }}>
          This list has no equipment items yet. Please ask the admin to add equipment to this list.
        </p>
        <button 
          onClick={() => window.history.back()} 
          style={{ padding: isMobile ? '8px 16px' : '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: baseFontSize }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '8px' : isTablet ? '16px' : '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontSize: baseFontSize
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: isMobile ? '6px' : '10px', 
          marginBottom: isMobile ? '8px' : '12px' 
        }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'none', border: 'none', color: '#006341',
              fontSize: isMobile ? '12px' : '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isMobile ? '4px 0' : '0'
            }}
          >
            ← Back
          </button>
          
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isMobile ? '6px 12px' : '10px 20px',
              background: '#c9a84c', color: '#004d32',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: isMobile ? '11px' : '14px', fontWeight: '600',
              alignSelf: isMobile ? 'stretch' : 'auto',
              justifyContent: 'center'
            }}
          >
            🖨️ Print Checklist
          </button>
        </div>
        
        <div style={{ borderBottom: '2px solid #d0e8dc', paddingBottom: isMobile ? '8px' : '12px' }}>
          <h1 style={{ 
            fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px', 
            color: '#004d32', 
            margin: '0 0 2px 0' 
          }}>
            📋 Equipment Checklist
          </h1>
          <h2 style={{ 
            fontSize: isMobile ? '15px' : isTablet ? '18px' : '20px', 
            color: '#006341', 
            margin: '0 0 2px 0' 
          }}>{listName}</h2>
          <p style={{ 
            color: '#6a8a7a', 
            margin: 0, 
            fontSize: isMobile ? '12px' : '14px' 
          }}>Department: {deptName || deptCode}</p>
          {submitted && submissionData && (
            <div style={{ 
              marginTop: isMobile ? '6px' : '10px', 
              padding: isMobile ? '6px 10px' : '8px 12px', 
              background: '#d1fae5', 
              borderRadius: '8px', 
              color: '#065f46', 
              fontSize: isMobile ? '11px' : '13px' 
            }}>
              ✅ Already submitted on: {new Date(submissionData.submittedAt).toLocaleString()} by {submissionData.submittedBy}
            </div>
          )}
        </div>
      </div>

      {/* Printable Content (hidden) */}
      <div ref={printRef} style={{ display: 'none' }} />

      {/* Controls */}
      {!submitted && (
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '10px', 
          marginBottom: isMobile ? '10px' : '16px', 
          flexWrap: 'wrap' 
        }}>
          <button 
            onClick={handleSelectAll} 
            style={{ 
              padding: isMobile ? '6px 12px' : '10px 20px', 
              background: '#006341', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: isMobile ? '11px' : '14px',
              flex: isMobile ? '1 1 auto' : 'none'
            }}
          >
            ✓ Select All
          </button>
          <button 
            onClick={handleClearAll} 
            style={{ 
              padding: isMobile ? '6px 12px' : '10px 20px', 
              background: '#e5e7eb', 
              color: '#374151', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: isMobile ? '11px' : '14px',
              flex: isMobile ? '1 1 auto' : 'none'
            }}
          >
            ✗ Clear All
          </button>
        </div>
      )}

      {/* Progress */}
      {!submitted && (
        <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '4px', 
            fontSize: isMobile ? '11px' : '14px', 
            color: '#4b5563' 
          }}>
            <span>📊 Progress: {checkedCount} / {totalCount} items checked</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div style={{ 
            height: isMobile ? '6px' : '8px', 
            background: '#e5e7eb', 
            borderRadius: '4px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${completionPercentage}%`, 
              background: '#006341', 
              borderRadius: '4px', 
              transition: 'width 0.3s ease' 
            }}></div>
          </div>
        </div>
      )}

      {/* Equipment Table */}
      <div style={{ 
        overflowX: 'auto', 
        marginBottom: isMobile ? '12px' : '20px', 
        borderRadius: '12px', 
        border: '1px solid #d0e8dc',
        WebkitOverflowScrolling: 'touch' // للتمرير السلس على iOS
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          background: 'white', 
          minWidth: isMobile ? '480px' : 'auto',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #d0e8dc' }}>
              <th style={{ 
                width: isMobile ? '32px' : '40px', 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'center',
                fontSize: isMobile ? '11px' : '14px'
              }}>✓</th>
              <th style={{ 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'left',
                fontSize: isMobile ? '11px' : '14px'
              }}>Image</th>
              <th style={{ 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'left',
                fontSize: isMobile ? '11px' : '14px'
              }}>Equipment Name</th>
              <th style={{ 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'left',
                fontSize: isMobile ? '11px' : '14px'
              }}>Code</th>
              <th style={{ 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'center',
                fontSize: isMobile ? '11px' : '14px'
              }}>Qty</th>
              <th style={{ 
                padding: isMobile ? '6px 4px' : '16px', 
                textAlign: 'left',
                fontSize: isMobile ? '11px' : '14px'
              }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => {
              const itemId = item._id.toString();
              const isChecked = checkedItems[itemId] || false;
              
              return (
                <tr key={itemId} style={{ borderBottom: '1px solid #e5e7eb', background: isChecked ? '#f0fdf4' : 'white' }}>
                  <td style={{ padding: isMobile ? '4px 2px' : '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheck(itemId)}
                      disabled={submitted}
                      style={{ 
                        width: isMobile ? '16px' : '20px', 
                        height: isMobile ? '16px' : '20px', 
                        cursor: submitted ? 'not-allowed' : 'pointer',
                        transform: isMobile ? 'scale(0.9)' : 'scale(1.2)'
                      }}
                    />
                  </td>
                  <td style={{ padding: isMobile ? '4px 2px' : '12px' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ 
                        width: isMobile ? '24px' : '40px', 
                        height: isMobile ? '24px' : '40px', 
                        objectFit: 'cover', 
                        borderRadius: '6px' 
                      }} />
                    ) : (
                      <div style={{ 
                        width: isMobile ? '24px' : '40px', 
                        height: isMobile ? '24px' : '40px', 
                        background: '#f3f4f6', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: isMobile ? '14px' : '20px' 
                      }}>📷</div>
                    )}
                  </td>
                  <td style={{ 
                    padding: isMobile ? '4px 2px' : '12px', 
                    fontWeight: '500',
                    fontSize: isMobile ? '11px' : '14px'
                  }}>
                    {item.name}
                    {isChecked && <span style={{ color: '#006341', marginLeft: '4px', fontWeight: 'bold' }}>✓</span>}
                  </td>
                  <td style={{ 
                    padding: isMobile ? '4px 2px' : '12px', 
                    color: '#6b7280',
                    fontSize: isMobile ? '10px' : '14px'
                  }}>{item.code || '—'}</td>
                  <td style={{ 
                    padding: isMobile ? '4px 2px' : '12px', 
                    textAlign: 'center',
                    fontSize: isMobile ? '11px' : '14px'
                  }}>{item.quantity || 0}</td>
                  <td style={{ padding: isMobile ? '4px 2px' : '12px' }}>
                    <span style={{
                      padding: isMobile ? '2px 6px' : '4px 12px',
                      borderRadius: '20px',
                      fontSize: isMobile ? '9px' : '12px',
                      fontWeight: '600',
                      background: item.status === 'Available' ? '#d1fae5' : item.status === 'In Use' ? '#fed7aa' : item.status === 'Under Maintenance' ? '#fee2e2' : '#fef3c7',
                      color: item.status === 'Available' ? '#065f46' : item.status === 'In Use' ? '#92400e' : item.status === 'Under Maintenance' ? '#991b1b' : '#92400e',
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
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
      <div style={{ 
        padding: isMobile ? '10px' : '16px', 
        background: '#f9fafb', 
        borderRadius: '12px', 
        marginBottom: isMobile ? '12px' : '16px' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          textAlign: 'center', 
          gap: isMobile ? '4px' : '8px' 
        }}>
          <div>
            <div style={{ 
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px', 
              fontWeight: '700', 
              color: '#006341' 
            }}>{checkedCount}</div>
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: '#6b7280' 
            }}>Checked</div>
          </div>
          <div>
            <div style={{ 
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px', 
              fontWeight: '700', 
              color: '#6b7280' 
            }}>{totalCount - checkedCount}</div>
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: '#6b7280' 
            }}>Remaining</div>
          </div>
          <div>
            <div style={{ 
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px', 
              fontWeight: '700', 
              color: '#006341' 
            }}>{totalCount}</div>
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: '#6b7280' 
            }}>Total</div>
          </div>
        </div>
      </div>

      {/* Submit */}
      {!submitted && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            style={{ 
              padding: isMobile ? '8px 16px' : '12px 32px', 
              background: '#006341', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: isMobile ? '13px' : '16px', 
              fontWeight: '600', 
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {saving ? '⏳ Submitting...' : '✅ Submit & Confirm'}
          </button>
        </div>
      )}

      {/* Submitted Message */}
      {submitted && submissionData && (
        <div style={{ 
          marginTop: isMobile ? '12px' : '20px', 
          textAlign: 'center', 
          padding: isMobile ? '12px' : '16px', 
          background: '#d1fae5', 
          borderRadius: '10px', 
          color: '#065f46',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          <p>✅ This checklist has been confirmed and submitted to OT Department.</p>
          <p>📅 Submitted on: {new Date(submissionData.submittedAt).toLocaleString()}</p>
          <p>👤 Submitted by: {submissionData.submittedBy}</p>
          <button 
            onClick={() => navigate('/ot-enhanced')}
            style={{ 
              marginTop: '8px', 
              padding: isMobile ? '6px 14px' : '8px 18px', 
              background: '#006341', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            Go to OT Department →
          </button>
        </div>
      )}
    </div>
  );
}

export default EquipmentChecklist;