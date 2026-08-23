import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading reports...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>Error: {error}</div>;
  }

  if (reports.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>No reports submitted yet.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📋 Submitted Checklists Reports</h1>
      {reports.map((report) => (
        <div key={report._id} style={{ border: '1px solid #ccc', margin: '20px 0', padding: '16px', borderRadius: '8px' }}>
          <h3>{report.listName || 'Unnamed List'}</h3>
          <p><strong>Department:</strong> {report.deptCode}</p>
          <p><strong>Submitted by:</strong> {report.submittedBy}</p>
          <p><strong>Submitted at:</strong> {new Date(report.submittedAt).toLocaleString()}</p>
          {report.expiryDate && <p><strong>Expiry Date:</strong> {new Date(report.expiryDate).toLocaleDateString()}</p>}
          <p><strong>Items checked:</strong> {Object.values(report.checkedItems || {}).filter(v => v).length} / {report.equipmentDetails?.length || 0}</p>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Show Equipment Details</summary>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>#</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Code</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Checked</th>
                </tr>
              </thead>
              <tbody>
                {(report.equipmentDetails || []).map((item, idx) => {
                  const checked = report.checkedItems?.[item._id] || false;
                  return (
                    <tr key={item._id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.code}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{checked ? '✅' : '❌'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>
        </div>
      ))}
    </div>
  );
}

export default Reports;