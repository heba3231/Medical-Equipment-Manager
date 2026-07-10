import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

function AddNewList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deptId } = useParams();
  
  const departmentName = location.state?.deptName || "A.N.C Department"; // Default to A.N.C Department
  const departmentId = location.state?.deptId || deptId || "default"; // Default to 'default' if no ID

  const [listName, setListName] = useState("");
  const [equipmentCategory, setEquipmentCategory] = useState("");
  const [description, setDescription] = useState("");
  const [itemsInList, setItemsInList] = useState([]); // This will hold the items added to the current list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dummy data for demonstration based on the mockup
  useEffect(() => {
    // This effect is for demonstration purposes to show items in list as per mockup
    // In a real application, these would be managed by adding/editing/deleting items
    setItemsInList([
      { id: 'EQ-1021', name: 'Portable Ultrasound Machine', qty: 3 },
      { id: 'EQ-1055', name: 'Infusion Pump', qty: 5 },
      { id: 'EQ-1102', name: 'Patient Monitor', qty: 2 },
    ]);
  }, []);

  const handleAddItemToList = () => {
    // Logic to add a new item to the current list
    // For now, just clear the form fields
    console.log("Adding item:", { listName, equipmentCategory, description });
    setListName("");
    setEquipmentCategory("");
    setDescription("");
    alert("Item added to list (demonstration only). In a real app, this would add to the itemsInList state.");
  };

  const handleEditItem = (id) => {
    alert(`Edit item with ID: ${id}`);
    // In a real app, this would navigate to an edit page or open a modal
  };

  const handleDeleteItem = (id) => {
    if (window.confirm(`Are you sure you want to delete item ${id}?`)) {
      setItemsInList(itemsInList.filter(item => item.id !== id));
      alert(`Item ${id} deleted.`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#dc2626', fontSize: '24px', marginBottom: '20px' }}>⚠️ Error</div>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      {/* Header */} 
      <header style={{
        backgroundColor: '#1e8449', // Dark green for header
        padding: '15px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* White Dove Logo - Placeholder, replace with actual SVG/Image */} 
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <path d="M22 10s-4 2-8 2-8-2-8-2V3l4 2 4-2 4 2 4-2v7z"/>
            <path d="M12 15c-4 0-8 2-8 2v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2s-4-2-8-2z"/>
          </svg>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>EquipCare</span>
        </div>
        <nav>
          {/* Navigation links - simplified for this page */} 
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginLeft: '20px' }}>Home</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginLeft: '20px' }}>Departments</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none', marginLeft: '20px' }}>Dashboard</a>
        </nav>
      </header>

      <div style={{ padding: '30px', maxWidth: '900px', margin: '40px auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '28px', color: '#1e8449', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          {departmentName} - Create New List
        </h2>

        {/* Form for adding new items */} 
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="listName" style={{ display: 'block', fontSize: '15px', color: '#333', marginBottom: '8px', fontWeight: '600' }}>List Name :</label>
            <input
              type="text"
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Enter list name"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="equipmentCategory" style={{ display: 'block', fontSize: '15px', color: '#333', marginBottom: '8px', fontWeight: '600' }}>Equipment Category:</label>
            <select
              id="equipmentCategory"
              value={equipmentCategory}
              onChange={(e) => setEquipmentCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select category</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="infusion">Infusion</option>
              <option value="monitor">Monitor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="description" style={{ display: 'block', fontSize: '15px', color: '#333', marginBottom: '8px', fontWeight: '600' }}>Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            ></textarea>
          </div>

          <button
            onClick={handleAddItemToList}
            style={{
              backgroundColor: '#f39c12', // Yellow/Orange color
              color: 'white',
              padding: '14px 25px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '17px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 8px rgba(243, 156, 18, 0.2)',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e68a00'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f39c12'}
          >
            Add Item
          </button>
        </div>

        {/* Items in List Section */} 
        <h3 style={{ fontSize: '22px', color: '#333', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Items in List</h3>
        {
          itemsInList.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No items added to this list yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {itemsInList.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9f9f9',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    border: '1px solid #eee',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" style={{ marginRight: '15px', transform: 'scale(1.2)' }} />
                    <div>
                      <p style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: '#333' }}>{item.name}</p>
                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#777' }}>ID: {item.id} | Qty: {item.qty} Units</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEditItem(item.id)}
                      style={{
                        backgroundColor: '#28a745', // Green for Edit
                        color: 'white',
                        padding: '8px 15px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        backgroundColor: '#dc3545', // Red for Delete
                        color: 'white',
                        padding: '8px 15px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default AddNewList;
