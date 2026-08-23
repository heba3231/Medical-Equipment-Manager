// Components/Reports.js
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function Reports() {
  const [reports, setReports] = useState([]); // ✅ تأكد من أنها مصفوفة فارغة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/checklist/reports`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setReports(data.data || []); // تأكد من أنها مصفوفة
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Loading reports...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>❌ Error: {error}</div>;
  }

  if (!reports || reports.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>📭 No reports submitted yet.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#004d32' }}>📋 Submitted Checklists Reports</h1>
      {reports.map((report) => (
        <div key={report._id} style={{ border: '1px solid #ccc', margin: '20px 0', padding: '16px', borderRadius: '8px', background: '#fff' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#004d32' }}>{report.listName || 'Unnamed List'}</h3>
          <p><strong>Department:</strong> {report.deptCode}</p>
          <p><strong>Submitted by:</strong> {report.submittedBy}</p>
          <p><strong>Submitted at:</strong> {new Date(report.submittedAt).toLocaleString()}</p>
          {report.expiryDate && <p><strong>Expiry Date:</strong> {new Date(report.expiryDate).toLocaleDateString()}</p>}
          <p><strong>Items checked:</strong> {Object.values(report.checkedItems || {}).filter(v => v).length} / {report.equipmentDetails?.length || 0}</p>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#006341' }}>🔍 Show Equipment Details</summary>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>#</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Name</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Code</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.equipmentDetails || []).map((item, idx) => {
                    // استخدام id المناسب (قد يكون _id أو id)
                    const itemId = item._id?.toString() || item.id;
                    const checked = report.checkedItems?.[itemId] || false;
                    return (
                      <tr key={itemId || idx}>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.code || '—'}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity || 0}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{checked ? '✅' : '❌'}</td>
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