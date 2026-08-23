// Components/Reports.js
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/checklist/reports`);
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Loading reports...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'red' }}>❌ Error: {error}</div>;
  }

  if (reports.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>📭 No reports submitted yet.</div>;
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#004d32', fontSize: '28px', marginBottom: '8px' }}>📋 Submitted Checklists Reports</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>All submitted checklists from OT Department and other departments</p>

      {reports.map((report, idx) => (
        <div key={report._id || idx} style={{
          border: '1px solid #d0e8dc',
          margin: '16px 0',
          padding: '20px 24px',
          borderRadius: '12px',
          background: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#004d32', fontSize: '18px' }}>
                {report.listName || 'Unnamed List'}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
                <span><strong>Department:</strong> {report.deptCode || '—'}</span>
                <span><strong>Source:</strong> {report.source === 'ot' ? '🏥 OT' : '📋 Department'}</span>
                <span><strong>Submitted by:</strong> {report.submittedBy || '—'}</span>
                <span><strong>Submitted at:</strong> {new Date(report.submittedAt).toLocaleString()}</span>
                {report.expiryDate && (
                  <span><strong>Expiry Date:</strong> <span style={{ color: '#b91c1c', fontWeight: '600' }}>{new Date(report.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></span>
                )}
              </div>
            </div>
            <div style={{
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#d1fae5',
              color: '#065f46'
            }}>
              ✅ Submitted
            </div>
          </div>

          <details style={{ marginTop: '8px' }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: '600',
              color: '#006341',
              fontSize: '14px',
              padding: '6px 0'
            }}>
              🔍 Show Equipment Details ({report.equipmentDetails?.length || 0} items)
            </summary>
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                minWidth: '500px'
              }}>
                <thead>
                  <tr style={{ background: '#f0f7f4' }}>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'left' }}>#</th>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'left' }}>Name</th>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'left' }}>Code</th>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'center' }}>Checked</th>
                    <th style={{ border: '1px solid #d0e8dc', padding: '8px 10px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.equipmentDetails || []).map((item, idx) => {
                    const itemId = item.id || item._id;
                    const checked = report.checkedItems?.[itemId]?.present !== undefined
                      ? (report.checkedItems[itemId].present > 0)
                      : (report.checkedItems?.[itemId] || false);
                    const checkData = report.checkedItems?.[itemId] || {};
                    let statusText = '✅ Present';
                    if (checkData.damaged && checkData.damagedQuantity > 0) {
                      statusText = `⚠️ Damaged (${checkData.damagedQuantity})`;
                    } else if (!checked) {
                      statusText = '❌ Missing';
                    }
                    return (
                      <tr key={item._id || item.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafcfb' }}>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px' }}>{item.name}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px', fontFamily: 'monospace' }}>{item.code || '—'}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px', textAlign: 'center' }}>{item.quantity || 0}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px', textAlign: 'center' }}>{checked ? '✅' : '❌'}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px 10px', textAlign: 'center' }}>{statusText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

export default Reports;