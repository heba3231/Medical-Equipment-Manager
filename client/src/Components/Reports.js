// Components/Reports.js
import React, { useState, useEffect } from 'react';

// ===================== التعديل الأساسي =====================
const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? `http://${window.location.hostname}:5000/api` 
    : '/api');
// ============================================================

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      console.log('📡 Fetching reports from:', `${API_BASE}/checklist/reports`);
      const response = await fetch(`${API_BASE}/checklist/reports`);
      console.log('📦 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📦 Reports data:', data);
      if (data.success) {
        setReports(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('❌ Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== Helper: get item status (supports boolean and object) ==========
  const getItemStatus = (item, checkedData) => {
    const required = item.quantity || 0;
    if (typeof checkedData === 'boolean') {
      return {
        present: checkedData ? required : 0,
        damaged: 0,
        missing: checkedData ? 0 : required,
        note: '',
        statusText: checkedData ? '✅ Present' : '❌ Missing',
        isBoolean: true
      };
    }
    if (checkedData && typeof checkedData === 'object') {
      const present = checkedData.present || 0;
      const damaged = checkedData.damaged ? (checkedData.damagedQuantity || 0) : 0;
      const missing = required - present;
      let statusText = '';
      if (damaged > 0) statusText = `⚠️ Damaged (${damaged})`;
      else if (present >= required) statusText = '✅ Present';
      else statusText = `❌ Missing (${missing})`;
      return {
        present,
        damaged,
        missing: Math.max(0, missing),
        note: checkedData.note || '',
        statusText,
        isBoolean: false
      };
    }
    return { present: 0, damaged: 0, missing: required, note: '', statusText: '❓ Unknown', isBoolean: false };
  };

  // ========== Print function ==========
  const handlePrintReport = (report) => {
    const printWindow = window.open('', '_blank');
    const items = report.equipmentDetails || [];
    const checkedItems = report.checkedItems || {};

    let tableRows = items.map((item, idx) => {
      const itemId = item._id?.toString() || item.id;
      const checkedData = checkedItems[itemId];
      const status = getItemStatus(item, checkedData);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.name || ''}</td>
          <td>${item.code || '—'}</td>
          <td style="text-align:center">${item.quantity || 0}</td>
          <td style="text-align:center">${status.present}</td>
          <td style="text-align:center">${status.damaged}</td>
          <td style="text-align:center">${status.missing}</td>
          <td>${status.statusText}</td>
          <td>${status.note || '—'}</td>
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
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
          thead th { background: #eef5f1; color: #004d32; font-weight: 700; padding: 6px 4px; border: 1px solid #999; text-align: left; }
          tbody td { padding: 5px 4px; border: 1px solid #ccc; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          .col-center { text-align: center; }
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
            <div class="meta-item"><strong>Items checked:</strong> ${items.length}</div>
            <div class="meta-item"><strong>Expiry Date:</strong> <span class="expiry">${report.expiryDate ? new Date(report.expiryDate).toLocaleDateString() : '—'}</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Code</th>
                <th class="col-center">Req.</th>
                <th class="col-center">Present</th>
                <th class="col-center">Damaged</th>
                <th class="col-center">Missing</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
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
        const items = report.equipmentDetails || [];
        const checkedItems = report.checkedItems || {};
        let totalPresent = 0, totalDamaged = 0, totalMissing = 0;
        items.forEach(item => {
          const itemId = item._id?.toString() || item.id;
          const status = getItemStatus(item, checkedItems[itemId]);
          totalPresent += status.present;
          totalDamaged += status.damaged;
          totalMissing += status.missing;
        });

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
              <p style={{ margin: '2px 0' }}><strong>Items:</strong> {items.length}</p>
              <p style={{ margin: '2px 0' }}><strong>Present:</strong> {totalPresent}</p>
              <p style={{ margin: '2px 0', color: '#b91c1c' }}><strong>Damaged:</strong> {totalDamaged}</p>
              <p style={{ margin: '2px 0', color: '#d97706' }}><strong>Missing:</strong> {totalMissing}</p>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#006341' }}>🔍 Show Equipment Details</summary>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>#</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Name</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Code</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Req.</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Present</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Damaged</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Missing</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const itemId = item._id?.toString() || item.id;
                      const checkedData = checkedItems[itemId];
                      const status = getItemStatus(item, checkedData);
                      return (
                        <tr key={itemId || idx}>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.code || '—'}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity || 0}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{status.present}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{status.damaged}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{status.missing}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{status.statusText}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{status.note || '—'}</td>
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