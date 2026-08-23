// Components/Reports.js
import React, { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef();

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
        setReports(data.data || []);
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

  // دالة طباعة تقرير واحد
  const handlePrintReport = (report) => {
    const printWindow = window.open('', '_blank');
    const checkedCount = Object.values(report.checkedItems || {}).filter(v => v).length;
    const totalItems = report.equipmentDetails?.length || 0;

    let tableRows = (report.equipmentDetails || []).map((item, idx) => {
      const itemId = item._id?.toString() || item.id;
      const checked = report.checkedItems?.[itemId] || false;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.name || ''}</td>
          <td>${item.code || '—'}</td>
          <td style="text-align:center">${item.quantity || 0}</td>
          <td style="text-align:center">${checked ? '✅' : '❌'}</td>
        </tr>
      `;
    }).join('');

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${report.listName || 'Checklist Report'}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; margin: 16mm 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1f2937; }
          .print-page { width: 100%; }
          .header {
            border-bottom: 2px solid #004d32;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .header h1 { margin: 0; color: #004d32; font-size: 20px; }
          .header .sub { color: #4b5563; font-size: 14px; }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
            margin-bottom: 16px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
          }
          .meta-item { font-size: 13px; }
          .meta-item strong { color: #004d32; }
          .expiry { color: #b91c1c; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
          thead th { background: #eef5f1; color: #004d32; font-weight: 700; padding: 8px 6px; border: 1px solid #999; text-align: left; }
          tbody td { padding: 6px; border: 1px solid #ccc; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="header">
            <h1>📋 ${report.listName || 'Checklist Report'}</h1>
            <div class="sub">Department: ${report.deptCode || '—'}</div>
          </div>
          <div class="meta-grid">
            <div class="meta-item"><strong>Submitted by:</strong> ${report.submittedBy || '—'}</div>
            <div class="meta-item"><strong>Submitted at:</strong> ${new Date(report.submittedAt).toLocaleString()}</div>
            <div class="meta-item"><strong>Items checked:</strong> ${checkedCount} / ${totalItems}</div>
            <div class="meta-item"><strong>Expiry Date:</strong> <span class="expiry">${report.expiryDate ? new Date(report.expiryDate).toLocaleDateString() : '—'}</span></div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Code</th><th style="text-align:center">Qty</th><th style="text-align:center">Checked</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">Generated from Medical Equipment System • ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => { printWindow.print(); };
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
      {reports.map((report) => {
        const checkedCount = Object.values(report.checkedItems || {}).filter(v => v).length;
        const totalItems = report.equipmentDetails?.length || 0;
        return (
          <div key={report._id} style={{ border: '1px solid #ccc', margin: '20px 0', padding: '16px', borderRadius: '8px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#004d32' }}>{report.listName || 'Unnamed List'}</h3>
              <button
                onClick={() => handlePrintReport(report)}
                style={{
                  padding: '6px 14px',
                  background: '#c9a84c',
                  color: '#004d32',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🖨️ Print
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 20px', margin: '8px 0 12px' }}>
              <p style={{ margin: '2px 0' }}><strong>Department:</strong> {report.deptCode}</p>
              <p style={{ margin: '2px 0' }}><strong>Submitted by:</strong> {report.submittedBy}</p>
              <p style={{ margin: '2px 0' }}><strong>Submitted at:</strong> {new Date(report.submittedAt).toLocaleString()}</p>
              {report.expiryDate && <p style={{ margin: '2px 0', color: '#b91c1c', fontWeight: '600' }}><strong>Expiry Date:</strong> {new Date(report.expiryDate).toLocaleDateString()}</p>}
              <p style={{ margin: '2px 0' }}><strong>Items checked:</strong> {checkedCount} / {totalItems}</p>
            </div>
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
        );
      })}
    </div>
  );
}

export default Reports;