// Components/ReportPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== STATE FOR DEPARTMENTS (Folders) =====
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // ===== FILTERS =====
  const [filterDept, setFilterDept] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  // ========== Load departments from localStorage ==========
  useEffect(() => {
    const loadDepartments = () => {
      try {
        const saved = localStorage.getItem('ot_departments');
        if (saved) {
          const depts = JSON.parse(saved);
          setDepartments(depts);
        }
      } catch (e) {
        console.warn('Could not load departments from localStorage', e);
      }
    };
    loadDepartments();
  }, []);

  // ========== Fetch reports ==========
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/checklists`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        setChecklists(data.data);
      } else {
        setError(data.message || 'Failed to load reports');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== Initial load ==========
  useEffect(() => {
    fetchReports();
  }, []);

  // ========== Reload when returning from checklist page ==========
  useEffect(() => {
    if (location.state?.refresh) {
      fetchReports();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // ========== Filtering ==========
  const filteredChecklists = useMemo(() => {
    let result = [...checklists];

    if (selectedDeptId) {
      result = result.filter(c => c.deptCode === selectedDeptId);
    }

    if (filterDept) {
      const term = filterDept.toLowerCase();
      result = result.filter(c =>
        c.deptCode?.toLowerCase().includes(term) ||
        c.deptName?.toLowerCase().includes(term) ||
        c.listName?.toLowerCase().includes(term)
      );
    }

    if (filterDate) {
      result = result.filter(c => {
        const d = new Date(c.submittedAt);
        return d.toISOString().slice(0, 10) === filterDate;
      });
    }

    result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return result;
  }, [checklists, selectedDeptId, filterDept, filterDate]);

  // ===== Details functions =====
  const openDetails = (checklist) => setSelectedChecklist(checklist);
  const closeDetails = () => setSelectedChecklist(null);

  // ===== Statistics =====
  const stats = useMemo(() => {
    const total = checklists.length;
    const depts = new Set(checklists.map(c => c.deptCode || c.deptName)).size;
    return { total, depts };
  }, [checklists]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  // ===== Icons =====
  const Icon = ({ name }) => {
    const icons = {
      back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
      list: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
      calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      user: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
      warning: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      checkCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
      refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
      folder: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
      wrench: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    };
    return icons[name] ? icons[name]() : null;
  };

  // ===== Loading and error states =====
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5ede9', borderTop: '3px solid #006341', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <h2>❌ {error}</h2>
        <button onClick={fetchReports} style={{ padding: '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  // ===============================
  // Main render with redesigned UI
  // ===============================
  return (
    <div style={{
      padding: isMobile ? '12px' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: '#f5f7f6',
      minHeight: '100vh'
    }}>
      {/* ===== Header ===== */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '24px',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '20px' : '28px',
            color: '#004d32',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}>
            <Icon name="list" /> Reports Dashboard
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '4px 0 0',
            fontSize: isMobile ? '13px' : '14px'
          }}>
            {selectedDeptId
              ? `📂 Showing reports for: ${departments.find(d => d.id === selectedDeptId)?.name || selectedDeptId}`
              : 'All submitted checklists'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchReports}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              padding: isMobile ? '8px 14px' : '10px 20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? '13px' : '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
          >
            <Icon name="refresh" /> Refresh
          </button>
          <button
            onClick={() => navigate('/ot-enhanced')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#006341',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: isMobile ? '8px 16px' : '10px 24px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? '13px' : '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#004d32'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#006341'}
          >
            <Icon name="back" /> Back to OT
          </button>
        </div>
      </div>

      {/* ===== Statistics ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#004d32' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Total Reports</div>
        </div>
        <div style={{
          background: 'white',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#c9a84c' }}>{stats.depts}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Departments</div>
        </div>
        <div style={{
          background: 'white',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#16a34a' }}>
            {checklists.filter(c => c.submitted).length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Confirmed</div>
        </div>
        <div style={{
          background: 'white',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#dc2626' }}>
            {checklists.reduce((sum, c) => sum + (c.missingCount || 0), 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Total Missing</div>
        </div>
      </div>

      {/* ===== Folders section (Departments) ===== */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        padding: isMobile ? '12px' : '16px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        alignItems: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <span style={{
          fontWeight: '600',
          color: '#004d32',
          fontSize: '14px',
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Icon name="folder" /> Folders:
        </span>

        {/* All button */}
        <button
          onClick={() => setSelectedDeptId('')}
          style={{
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '20px',
            border: selectedDeptId === '' ? '2px solid #006341' : '1px solid #d0e8dc',
            background: selectedDeptId === '' ? '#006341' : 'white',
            color: selectedDeptId === '' ? 'white' : '#374151',
            fontWeight: '600',
            fontSize: isMobile ? '12px' : '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          🗂️ All
        </button>

        {/* Department buttons */}
        {departments.map(dept => {
          const count = checklists.filter(c => c.deptCode === dept.id).length;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                borderRadius: '20px',
                border: selectedDeptId === dept.id ? '2px solid #c9a84c' : '1px solid #d0e8dc',
                background: selectedDeptId === dept.id ? '#fef9ec' : 'white',
                color: selectedDeptId === dept.id ? '#004d32' : '#374151',
                fontWeight: selectedDeptId === dept.id ? '700' : '500',
                fontSize: isMobile ? '12px' : '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon name="folder" />
              {dept.name}
              <span style={{
                background: count > 0 ? '#e6f0ec' : '#f3f4f6',
                color: count > 0 ? '#065f46' : '#9ca3af',
                borderRadius: '999px',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: '700',
                marginLeft: '4px'
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {departments.length === 0 && (
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>
            No departments found. Add departments from the OT Department page.
          </span>
        )}
      </div>

      {/* ===== Filters ===== */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        marginBottom: '20px',
        background: 'white',
        padding: isMobile ? '12px' : '16px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb'
      }}>
        <input
          type="text"
          placeholder="Search reports..."
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1.5px solid #d0e8dc',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            minWidth: isMobile ? '100%' : 'auto'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#006341'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d0e8dc'}
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1.5px solid #d0e8dc',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            minWidth: isMobile ? '100%' : '180px'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#006341'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d0e8dc'}
        />
        {(selectedDeptId || filterDept || filterDate) && (
          <button
            onClick={() => { setSelectedDeptId(''); setFilterDept(''); setFilterDate(''); }}
            style={{
              padding: '8px 16px',
              background: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#374151',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
          >
            Clear All
          </button>
        )}
      </div>

      {/* ===== Reports list ===== */}
      {filteredChecklists.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0', fontSize: isMobile ? '18px' : '22px' }}>No reports found</h3>
          <p style={{ color: '#6b7280', margin: '0 0 16px 0', fontSize: isMobile ? '13px' : '14px' }}>
            {selectedDeptId
              ? `No reports submitted for department "${departments.find(d => d.id === selectedDeptId)?.name || selectedDeptId}" yet.`
              : 'No reports have been submitted yet.'}
          </p>
          <button
            onClick={fetchReports}
            style={{
              padding: '8px 20px',
              background: '#006341',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#004d32'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#006341'}
          >
            Refresh
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredChecklists.map((item) => (
            <div
              key={item._id || item.id || item.listId}
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: isMobile ? '14px' : '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '8px' : '0',
                cursor: 'pointer',
                border: '1px solid #e5e7eb',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onClick={() => openDetails(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#006341';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontWeight: '700',
                    color: '#004d32',
                    fontSize: isMobile ? '15px' : '17px'
                  }}>
                    {item.listName || 'Equipment List'}
                  </span>
                  <span style={{
                    background: '#e6f0ec',
                    color: '#065f46',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.deptCode || item.deptName || 'Department'}
                  </span>
                  <span style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    ✅ Submitted
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: isMobile ? '8px' : '16px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="user" /> {item.submittedBy || 'Unknown'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="calendar" /> {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="warning" /> Missing: {item.missingCount || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="wrench" /> Damaged: {item.damagedCount || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✅ Checked: {item.checkedCount || 0} / {item.totalItems || 0}
                  </span>
                  {item.expiryDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
                      🗓️ Expires: {formatDate(item.expiryDate)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                marginTop: isMobile ? '8px' : '0'
              }}>
                <span style={{
                  color: '#006341',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Details Modal ===== */}
      {selectedChecklist && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeDetails}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: isMobile ? '20px' : '28px',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetails}
              style={{
                position: 'sticky',
                top: 0,
                float: 'right',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'color 0.2s',
                padding: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <Icon name="close" />
            </button>

            <h2 style={{
              color: '#004d32',
              marginTop: 0,
              marginBottom: '16px',
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600'
            }}>
              {selectedChecklist.listName || 'Checklist Details'}
            </h2>

            {/* Summary cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#f0fdf4',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #dcfce7'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>{selectedChecklist.checkedCount || 0}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Checked</div>
              </div>
              <div style={{
                background: '#fef2f2',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #fee2e2'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>{selectedChecklist.missingCount || 0}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Missing</div>
              </div>
              <div style={{
                background: '#fffbeb',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #fef3c7'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#d97706' }}>{selectedChecklist.damagedCount || 0}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Damaged</div>
              </div>
              <div style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#374151' }}>{selectedChecklist.totalItems || 0}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Items</div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '10px',
              marginBottom: '20px',
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div><strong>Department:</strong> {selectedChecklist.deptCode || selectedChecklist.deptName || '—'}</div>
              <div><strong>Submitted By:</strong> {selectedChecklist.submittedBy || '—'}</div>
              <div><strong>Submitted At:</strong> {selectedChecklist.submittedAt ? new Date(selectedChecklist.submittedAt).toLocaleString() : '—'}</div>
              <div><strong>Expiry Date:</strong> {formatDate(selectedChecklist.expiryDate)}</div>
              <div><strong>Status:</strong> {selectedChecklist.submitted ? '✅ Confirmed' : '⏳ Draft'}</div>
            </div>

            {/* Equipment table */}
            {selectedChecklist.equipmentDetails && selectedChecklist.equipmentDetails.length > 0 && (
              <div>
                <h4 style={{
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '8px',
                  marginBottom: '12px',
                  color: '#004d32',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>Equipment Details</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Name</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Code</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Qty</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChecklist.equipmentDetails.map((item) => {
                        // ===== IMPROVED KEY DETECTION =====
                        let key = null;
                        if (item.id) key = item.id;
                        else if (item._id) key = item._id.toString();

                        // ===== CHECK FOR DAMAGED (try both id and _id) =====
                        let isDamaged = false;
                        if (key && selectedChecklist.damagedItems) {
                          if (selectedChecklist.damagedItems[key] !== undefined) {
                            isDamaged = true;
                          } else {
                            // Try alternative key
                            const altKey = item._id ? item._id.toString() : null;
                            if (altKey && selectedChecklist.damagedItems[altKey] !== undefined) {
                              isDamaged = true;
                            }
                          }
                        }

                        // ===== CHECK FOR PRESENT =====
                        let isChecked = false;
                        if (key && selectedChecklist.checkedItems) {
                          if (selectedChecklist.checkedItems[key] !== undefined) {
                            isChecked = selectedChecklist.checkedItems[key];
                          } else {
                            const altKey = item._id ? item._id.toString() : null;
                            if (altKey && selectedChecklist.checkedItems[altKey] !== undefined) {
                              isChecked = selectedChecklist.checkedItems[altKey];
                            }
                          }
                        }

                        // ===== DETERMINE STATUS =====
                        let statusText = '';
                        let statusColor = '';
                        let statusBg = '';
                        if (isDamaged) {
                          statusText = '⚠️ Damaged';
                          statusColor = '#b45309';
                          statusBg = '#fffbeb';
                        } else if (isChecked) {
                          statusText = '✅ Present';
                          statusColor = '#16a34a';
                          statusBg = '#f0fdf4';
                        } else {
                          statusText = '❌ Missing';
                          statusColor = '#dc2626';
                          statusBg = '#fef2f2';
                        }

                        return (
                          <tr key={item._id || item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{item.code || '—'}</td>
                            <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{item.quantity || 0}</td>
                            <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                              <span style={{
                                color: statusColor,
                                fontWeight: '600',
                                background: statusBg,
                                padding: '2px 10px',
                                borderRadius: '12px',
                                display: 'inline-block',
                                fontSize: '13px'
                              }}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={closeDetails}
                style={{
                  padding: '8px 24px',
                  background: '#006341',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#004d32'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#006341'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportPage;