// Components/EquipmentChecklist.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

// ✅ Responsive hook
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

  const isNewCheck = location.state?.newCheck || false;

  const listName = location.state?.listName || "Equipment List";
  const deptName = location.state?.deptName || deptCode || "Department";

  const [equipment, setEquipment] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [error, setError] = useState(null);

  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  // ========== Load equipment ==========
  useEffect(() => {
    if (!listId) {
      setError("No list ID provided");
      setLoading(false);
      return;
    }
    fetchEquipment();
    if (!isNewCheck) {
      fetchSavedChecklist();
    } else {
      setSubmitted(false);
      setSubmissionData(null);
    }
  }, [listId, isNewCheck]);

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

  // ========== Interactions ==========
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

  const handleStartNewCheck = () => {
    const initialChecked = {};
    equipment.forEach(item => {
      const id = item._id.toString();
      initialChecked[id] = false;
    });
    setCheckedItems(initialChecked);
    setSubmitted(false);
    setSubmissionData(null);
    navigate(`/checklist/${deptCode}/${listId}`, {
      state: { listName, deptName, newCheck: true },
      replace: true
    });
  };

  // ========== Submit (creates new report) ==========
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const userName = localStorage.getItem("userName") ||
                       JSON.parse(localStorage.getItem("user") || "{}")?.name ||
                       "Staff";
      const userRole = localStorage.getItem("userRole") || "staff";

      const checkedItemsStr = {};
      Object.keys(checkedItems).forEach(key => {
        checkedItemsStr[key.toString()] = checkedItems[key];
      });

      const payload = {
        listId,
        deptCode,
        listName,
        checkedItems: checkedItemsStr,
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
        navigate('/reports', { state: { refresh: true } });
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

  // ========== Print ==========
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

  // ========== Stats ==========
  const checkedCount = Object.values(checkedItems).filter(v => v === true).length;
  const totalCount = equipment.length;
  const completionPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const statusStyle = (status) => ({
    background: status === 'Available' ? '#d1fae5' : status === 'In Use' ? '#fed7aa' : status === 'Under Maintenance' ? '#fee2e2' : '#fef3c7',
    color: status === 'Available' ? '#065f46' : status === 'In Use' ? '#92400e' : status === 'Under Maintenance' ? '#991b1b' : '#92400e',
  });

  // ========== Error / Loading ==========
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '30px 16px' : '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#dc2626', marginBottom: '10px', fontSize: isMobile ? '18px' : '24px' }}>Error</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: isMobile ? '14px' : '16px' }}>{error}</p>
        <button
          onClick={() => window.history.back()}
          style={{ padding: isMobile ? '10px 20px' : '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px', minHeight: '44px' }}
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
        <p style={{ fontSize: isMobile ? '14px' : '16px' }}>Loading checklist...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '30px 16px' : '60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '20px' }}>📋</div>
        <h2 style={{ color: '#004d32', marginBottom: '10px', fontSize: isMobile ? '18px' : '24px' }}>No Equipment Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: isMobile ? '14px' : '16px' }}>
          This list has no equipment items yet. Please ask the admin to add equipment to this list.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{ padding: isMobile ? '10px 20px' : '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px', minHeight: '44px' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // =============================================================
  // ========== MAIN RENDER (UI redesign – fully responsive) =====
  // =============================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f6f8f7',
        padding: isMobile
          ? '12px 10px 100px'
          : isTablet
          ? '20px 16px 40px'
          : '28px 24px 40px',
        boxSizing: 'border-box',
        width: '100%',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto'
        }}
      >

        {/* ================= HEADER ================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e3ebe7',
            borderRadius: isMobile ? '14px' : '18px',
            padding: isMobile ? '14px' : '20px 24px',
            marginBottom: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
          }}
        >

          {/* Top Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              marginBottom: isMobile ? '14px' : '18px'
            }}
          >
            <button
              onClick={() => window.history.back()}
              style={{
                border: 'none',
                background: '#f3f7f5',
                color: '#006341',
                padding: isMobile ? '10px 13px' : '9px 14px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: '600',
                minHeight: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ← Back
            </button>

            <button
              onClick={handlePrint}
              style={{
                border: '1px solid #d8c27b',
                background: '#fffaf0',
                color: '#705716',
                padding: isMobile ? '10px 13px' : '9px 16px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: '600',
                minHeight: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ <span>Print</span>
            </button>
          </div>

          {/* Title */}
          <div
            style={{
              borderBottom: '1px solid #e5ece8',
              paddingBottom: isMobile ? '13px' : '16px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '11px'
              }}
            >
              <div
                style={{
                  width: isMobile ? '42px' : '48px',
                  height: isMobile ? '42px' : '48px',
                  minWidth: isMobile ? '42px' : '48px',
                  borderRadius: '11px',
                  background: '#e8f4ef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '21px' : '24px'
                }}
              >
                📋
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h1
                  style={{
                    margin: '0',
                    color: '#003d29',
                    fontSize: isMobile ? '19px' : isTablet ? '23px' : '27px',
                    lineHeight: 1.25,
                    fontWeight: '700',
                    wordBreak: 'break-word'
                  }}
                >
                  Equipment Checklist
                </h1>

                <h2
                  style={{
                    margin: '4px 0 3px',
                    color: '#006341',
                    fontSize: isMobile ? '14px' : '17px',
                    lineHeight: 1.35,
                    fontWeight: '600',
                    wordBreak: 'break-word'
                  }}
                >
                  {listName}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#71827a',
                    fontSize: isMobile ? '12px' : '13px',
                    lineHeight: 1.4
                  }}
                >
                  Department: {deptName || deptCode}
                </p>
              </div>
            </div>

            {/* Submitted info */}
            {submitted && submissionData && (
              <div
                style={{
                  marginTop: '12px',
                  padding: isMobile ? '10px 11px' : '11px 13px',
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  borderRadius: '9px',
                  color: '#166534',
                  fontSize: isMobile ? '11px' : '12px',
                  lineHeight: 1.5
                }}
              >
                <strong>✓ Completed</strong>
                <br />
                {new Date(submissionData.submittedAt).toLocaleString()}
                {' · '}
                {submissionData.submittedBy}
              </div>
            )}
          </div>
        </div>


        {/* ================= NEW CHECK ================= */}
        {submitted && !isNewCheck && (
          <div
            style={{
              background: '#fffaf0',
              border: '1px solid #f1dfad',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '14px 16px',
              marginBottom: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#795b14',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '700',
                    marginBottom: '3px'
                  }}
                >
                  ⚠️ Checklist completed
                </div>

                <div
                  style={{
                    color: '#92742b',
                    fontSize: isMobile ? '11px' : '12px'
                  }}
                >
                  Start a new inspection if you want to check this list again.
                </div>
              </div>

              <button
                onClick={handleStartNewCheck}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  border: 'none',
                  background: '#006341',
                  color: '#ffffff',
                  padding: '11px 16px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Start New Check
              </button>
            </div>
          </div>
        )}


        {/* ================= CONTROLS ================= */}
        {!submitted && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto',
              gap: '8px',
              marginBottom: '12px'
            }}
          >
            <button
              onClick={handleSelectAll}
              style={{
                border: 'none',
                background: '#006341',
                color: '#ffffff',
                padding: isMobile ? '11px 8px' : '10px 18px',
                borderRadius: '9px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              ✓ Select All
            </button>

            <button
              onClick={handleClearAll}
              style={{
                border: '1px solid #d9e1dd',
                background: '#ffffff',
                color: '#47534d',
                padding: isMobile ? '11px 8px' : '10px 18px',
                borderRadius: '9px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              ✕ Clear All
            </button>
          </div>
        )}


        {/* ================= PROGRESS ================= */}
        {!submitted && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e3ebe7',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '14px 16px',
              marginBottom: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <span
                style={{
                  color: '#45544c',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '600'
                }}
              >
                Progress
              </span>

              <span
                style={{
                  color: '#006341',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '700'
                }}
              >
                {checkedCount}/{totalCount} · {Math.round(completionPercentage)}%
              </span>
            </div>

            <div
              style={{
                height: '7px',
                width: '100%',
                background: '#e7eeeb',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completionPercentage}%`,
                  background: '#006341',
                  borderRadius: '10px',
                  transition: 'width .3s ease'
                }}
              />
            </div>
          </div>
        )}


        {/* ================= EQUIPMENT ================= */}

        {isMobile ? (

          /* ---------- MOBILE CARDS ---------- */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            {equipment.map((item, index) => {
              const itemId = item._id.toString();
              const isChecked = checkedItems[itemId] || false;
              const sStyle = statusStyle(item.status || 'Available');

              return (
                <div
                  key={itemId}
                  onClick={() => handleCheck(itemId)}
                  style={{
                    background: isChecked ? '#f3fbf7' : '#ffffff',
                    border: isChecked
                      ? '1px solid #9bd5bd'
                      : '1px solid #e1e9e5',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: submitted ? 'default' : 'pointer',
                    boxShadow: isChecked
                      ? '0 2px 7px rgba(0,99,65,.07)'
                      : '0 1px 4px rgba(0,0,0,.025)',
                    transition: 'all .2s ease'
                  }}
                >

                  {/* Checkbox */}
                  <div
                    style={{
                      width: '28px',
                      minWidth: '28px',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheck(itemId)}
                      disabled={submitted}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '22px',
                        height: '22px',
                        cursor: submitted ? 'not-allowed' : 'pointer',
                        accentColor: '#006341'
                      }}
                    />
                  </div>

                  {/* Image */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        minWidth: '46px',
                        objectFit: 'cover',
                        borderRadius: '9px',
                        border: '1px solid #e1e8e5'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        minWidth: '46px',
                        background: '#f3f6f5',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '19px'
                      }}
                    >
                      📷
                    </div>
                  )}

                  {/* Information */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '4px',
                        marginBottom: '4px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          lineHeight: 1.3,
                          fontWeight: '700',
                          color: '#17211d',
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.name}
                      </span>

                      {isChecked && (
                        <span
                          style={{
                            color: '#006341',
                            fontWeight: 'bold',
                            fontSize: '13px'
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        style={{
                          color: '#68756e',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          background: '#f5f7f6',
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.code || '—'}
                      </span>

                      <span
                        style={{
                          color: '#6b756f',
                          fontSize: '10px'
                        }}
                      >
                        Qty {item.quantity || 0}
                      </span>

                      <span
                        style={{
                          padding: '3px 7px',
                          borderRadius: '20px',
                          fontSize: '9px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          ...sStyle
                        }}
                      >
                        {item.status || 'Available'}
                      </span>
                    </div>
                  </div>

                  {/* Number */}
                  <span
                    style={{
                      color: '#a1aaa5',
                      fontSize: '10px',
                      alignSelf: 'flex-start'
                    }}
                  >
                    #{index + 1}
                  </span>
                </div>
              );
            })}
          </div>

        ) : (

          /* ---------- TABLET / DESKTOP ---------- */
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e0e8e4',
              borderRadius: '14px',
              overflowX: 'auto',
              marginBottom: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,.025)'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: isTablet ? '680px' : '760px'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#f3f7f5',
                    borderBottom: '1px solid #dce7e2'
                  }}
                >
                  <th style={{ padding: '13px', width: '50px' }}>✓</th>
                  <th style={{ padding: '13px', width: '70px', textAlign: 'left' }}>
                    Image
                  </th>
                  <th style={{ padding: '13px', textAlign: 'left' }}>
                    Equipment Name
                  </th>
                  <th style={{ padding: '13px', textAlign: 'left' }}>
                    Code
                  </th>
                  <th style={{ padding: '13px', textAlign: 'center' }}>
                    Qty
                  </th>
                  <th style={{ padding: '13px', textAlign: 'left' }}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {equipment.map((item) => {
                  const itemId = item._id.toString();
                  const isChecked = checkedItems[itemId] || false;
                  const sStyle = statusStyle(item.status || 'Available');

                  return (
                    <tr
                      key={itemId}
                      style={{
                        borderBottom: '1px solid #edf1ef',
                        background: isChecked ? '#f5fbf8' : '#ffffff'
                      }}
                    >
                      <td
                        style={{
                          padding: '11px',
                          textAlign: 'center'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheck(itemId)}
                          disabled={submitted}
                          style={{
                            width: '20px',
                            height: '20px',
                            accentColor: '#006341',
                            cursor: submitted ? 'not-allowed' : 'pointer'
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px' }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              background: '#f3f6f5',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            📷
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#17211d'
                        }}
                      >
                        {item.name}

                        {isChecked && (
                          <span
                            style={{
                              color: '#006341',
                              marginLeft: '5px'
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          color: '#6b756e',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {item.code || '—'}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          textAlign: 'center',
                          fontSize: '13px',
                          color: '#45534c'
                        }}
                      >
                        {item.quantity || 0}
                      </td>

                      <td style={{ padding: '11px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 9px',
                            borderRadius: '20px',
                            fontSize: '10px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            ...sStyle
                          }}
                        >
                          {item.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {/* ================= SUMMARY ================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e1e9e5',
            borderRadius: '13px',
            padding: isMobile ? '13px 8px' : '16px',
            marginBottom: '14px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)'
            }}
          >

            <div
              style={{
                textAlign: 'center',
                borderRight: '1px solid #e5ebe8'
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? '21px' : '25px',
                  fontWeight: '700',
                  color: '#006341'
                }}
              >
                {checkedCount}
              </div>

              <div
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#758079',
                  marginTop: '2px'
                }}
              >
                Checked
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                borderRight: '1px solid #e5ebe8'
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? '21px' : '25px',
                  fontWeight: '700',
                  color: '#6b756f'
                }}
              >
                {totalCount - checkedCount}
              </div>

              <div
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#758079',
                  marginTop: '2px'
                }}
              >
                Remaining
              </div>
            </div>

            <div
              style={{
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? '21px' : '25px',
                  fontWeight: '700',
                  color: '#006341'
                }}
              >
                {totalCount}
              </div>

              <div
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#758079',
                  marginTop: '2px'
                }}
              >
                Total
              </div>
            </div>

          </div>
        </div>


        {/* ================= SUBMIT ================= */}
        {!submitted && (
          <div
            style={
              isMobile
                ? {
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 100,
                    background: 'rgba(255,255,255,.97)',
                    borderTop: '1px solid #dfe7e3',
                    padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
                    boxShadow: '0 -4px 16px rgba(0,0,0,.08)'
                  }
                : {
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '4px'
                  }
            }
          >
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                width: isMobile ? '100%' : '280px',
                minHeight: isMobile ? '50px' : '48px',
                border: 'none',
                borderRadius: '10px',
                background: '#006341',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 3px 10px rgba(0,99,65,.18)'
              }}
            >
              {saving ? '⏳ Submitting...' : '✓ Submit & Confirm'}
            </button>
          </div>
        )}


        {/* ================= SUBMITTED ================= */}
        {submitted && submissionData && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #bbf7d0',
              borderRadius: '13px',
              padding: isMobile ? '14px' : '18px',
              textAlign: 'center',
              color: '#166534',
              fontSize: isMobile ? '12px' : '13px',
              lineHeight: 1.7
            }}
          >
            <div
              style={{
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: '700',
                marginBottom: '5px'
              }}
            >
              ✓ Checklist Confirmed
            </div>

            <div>
              Submitted on:{' '}
              {new Date(submissionData.submittedAt).toLocaleString()}
            </div>

            <div>
              Submitted by: {submissionData.submittedBy}
            </div>

            <button
              onClick={() => navigate('/reports')}
              style={{
                marginTop: '10px',
                width: isMobile ? '100%' : 'auto',
                minHeight: '44px',
                padding: '10px 18px',
                border: 'none',
                borderRadius: '8px',
                background: '#006341',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Reports →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default EquipmentChecklist;