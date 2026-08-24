// Components/ReportPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

// Hook للاستجابة
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
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState(null); // للتفاصيل

  const { width } = useWindowSize();
  const isMobile = width < 768;

  // جلب جميع التقارير
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/checklists`);
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

  // التصفية
  const filteredChecklists = useMemo(() => {
    let result = [...checklists];
    if (filterDept) {
      result = result.filter(c => c.deptCode === filterDept || c.deptName?.toLowerCase().includes(filterDept.toLowerCase()));
    }
    if (filterDate) {
      result = result.filter(c => {
        const d = new Date(c.submittedAt);
        return d.toISOString().slice(0, 10) === filterDate;
      });
    }
    // ترتيب حسب الأحدث
    result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return result;
  }, [checklists, filterDept, filterDate]);

  // عرض التفاصيل
  const openDetails = (checklist) => {
    setSelectedChecklist(checklist);
  };

  const closeDetails = () => {
    setSelectedChecklist(null);
  };

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const total = checklists.length;
    const depts = new Set(checklists.map(c => c.deptCode || c.deptName)).size;
    return { total, depts };
  }, [checklists]);

  // أيقونات SVG بسيطة
  const Icon = ({ name }) => {
    const icons = {
      back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
      list: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
      calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      user: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    };
    return icons[name] ? icons[name]() : null;
  };

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
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#006341', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{
      padding: isMobile ? '12px' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: '#f5f7f6',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '24px',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '28px', color: '#004d32', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="list" /> Reports Dashboard
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: isMobile ? '13px' : '14px' }}>
            All submitted checklists
          </p>
        </div>
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
            fontSize: isMobile ? '13px' : '14px'
          }}
        >
          <Icon name="back" /> Back to OT
        </button>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#004d32' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Reports</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#c9a84c' }}>{stats.depts}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Departments</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#006341' }}>
            {checklists.filter(c => c.submitted).length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Confirmed</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        marginBottom: '20px',
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <input
          type="text"
          placeholder="Filter by department..."
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1.5px solid #d0e8dc',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
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
            outline: 'none'
          }}
        />
        {(filterDept || filterDate) && (
          <button
            onClick={() => { setFilterDept(''); setFilterDate(''); }}
            style={{
              padding: '8px 16px',
              background: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* List of reports */}
      {filteredChecklists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>No reports found</h3>
          <p>Try adjusting your filters or wait for new submissions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredChecklists.map((item) => (
            <div
              key={item._id || item.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '14px' : '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '8px' : '0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => openDetails(item)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#006341'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', color: '#004d32', fontSize: isMobile ? '15px' : '17px' }}>
                    {item.listName || 'Equipment List'}
                  </span>
                  <span style={{
                    background: '#e6f0ec',
                    color: '#065f46',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {item.deptCode || item.deptName || 'Department'}
                  </span>
                  <span style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    ✅ Submitted
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="user" /> {item.submittedBy || 'Unknown'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="calendar" /> {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#006341', fontWeight: '600', fontSize: '14px' }}>
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for details */}
      {selectedChecklist && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: isMobile ? '16px' : '24px',
              position: 'relative'
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
                color: '#999'
              }}
            >
              <Icon name="close" />
            </button>

            <h2 style={{ color: '#004d32', marginTop: 0 }}>{selectedChecklist.listName || 'Checklist Details'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><strong>Department:</strong> {selectedChecklist.deptCode || selectedChecklist.deptName || '—'}</div>
              <div><strong>Submitted By:</strong> {selectedChecklist.submittedBy || '—'}</div>
              <div><strong>Submitted At:</strong> {selectedChecklist.submittedAt ? new Date(selectedChecklist.submittedAt).toLocaleString() : '—'}</div>
              <div><strong>Status:</strong> {selectedChecklist.submitted ? '✅ Confirmed' : '⏳ Draft'}</div>
            </div>

            {selectedChecklist.checkedItems && (
              <div>
                <h4 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Equipment Checked</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Item</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Checked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedChecklist.checkedItems).map(([id, checked]) => {
                        // قد يكون لدينا اسم العنصر في البيانات، نحاول إيجاده من خلال equipment الموجود في الكائن
                        // أو نعرض المعرف
                        return (
                          <tr key={id}>
                            <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{id}</td>
                            <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                              {checked ? '✅' : '⬜'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={closeDetails}
                style={{
                  padding: '8px 24px',
                  background: '#006341',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
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