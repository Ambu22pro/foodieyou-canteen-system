import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);

  // New Menu Item Form States
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const fetchData = async () => {
    try {
      const resUsers = await fetch('http://localhost:5000/api/users');
      const dataUsers = await resUsers.json();
      if (Array.isArray(dataUsers)) setUsers(dataUsers);

      const resOrders = await fetch('http://localhost:5000/api/orders');
      const dataOrders = await resOrders.json();
      if (Array.isArray(dataOrders)) setOrders(dataOrders);

      const resMenu = await fetch('http://localhost:5000/api/menu');
      const dataMenu = await resMenu.json();
      if (Array.isArray(dataMenu)) setMenu(dataMenu);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('user_registered', (newUser) => {
      setUsers((prev) => [newUser, ...prev]);
    });

    socket.on('user_status_updated', (updated) => {
      setUsers((prev) => prev.map(u => u._id === updated._id ? updated : u));
    });

    socket.on('new_order', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    socket.on('order_status_updated', (updated) => {
      setOrders((prev) => prev.map(o => o.tokenNumber === updated.tokenNumber ? updated : o));
    });

    socket.on('menu_updated', (updatedMenu) => {
      setMenu(updatedMenu);
    });

    return () => {
      socket.off('user_registered');
      socket.off('user_status_updated');
      socket.off('new_order');
      socket.off('order_status_updated');
      socket.off('menu_updated');
    };
  }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/users/${id}/approve`, {
        method: 'PUT'
      });
      fetchData();
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemCategory) return;

    try {
      await fetch('http://localhost:5000/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          price: Number(newItemPrice),
          category: newItemCategory
        })
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemCategory('');
      fetchData();
    } catch (err) {
      console.error('Error adding menu item:', err);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/menu/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const fulfilledOrdersCount = orders.filter(o => o.status === 'completed' || o.status === 'fulfilled').length;
  const pendingUsersList = users.filter(u => u.status === 'pending');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#ffffff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Superadmin Control Center</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={fetchData} 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              Refresh Data 🔄
            </button>
            <button 
              onClick={onLogout} 
              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              Sign Out 🚪
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{ padding: '12px 20px', borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'analytics' ? '#111827' : '#ffffff', color: activeTab === 'analytics' ? '#ffffff' : '#4b5563', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            📊 Sales & Analytics
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            style={{ padding: '12px 20px', borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'approvals' ? '#111827' : '#ffffff', color: activeTab === 'approvals' ? '#ffffff' : '#4b5563', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            👥 User Approvals ({pendingUsersList.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            style={{ padding: '12px 20px', borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'menu' ? '#111827' : '#ffffff', color: activeTab === 'menu' ? '#ffffff' : '#4b5563', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            🍔 Menu Management ({menu.length})
          </button>
        </div>

        {/* Tab 1: Sales & Analytics */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>Total Sales Revenue</p>
              <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>₹{totalRevenue}</h3>
            </div>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>Fulfilled Orders</p>
              <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{fulfilledOrdersCount}</h3>
            </div>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>Total Registered Users</p>
              <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{users.length}</h3>
            </div>
          </div>
        )}

        {/* Tab 2: User Approvals */}
        {activeTab === 'approvals' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>Pending User Approvals</h2>
            {pendingUsersList.length === 0 ? (
              <p style={{ color: '#6b7280', padding: '24px 0', textAlign: 'center' }}>No pending user approvals found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingUsersList.map(u => (
                  <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb' }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>{u.name}</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{u.email} ({u.role})</p>
                    </div>
                    <button
                      onClick={() => handleApprove(u._id)}
                      style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Menu Management */}
        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Add New Menu Item Form */}
            <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>Add New Menu Item</h2>
              <form onSubmit={handleAddMenuItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Veg Burger"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Snacks"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '11px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', height: '42px' }}
                >
                  + Add Item
                </button>
              </form>
            </div>

            {/* Menu Items List */}
            <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>Existing Canteen Menu</h2>
              {menu.length === 0 ? (
                <p style={{ color: '#6b7280', padding: '20px 0', textAlign: 'center' }}>No menu items available.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {menu.map(item => (
                    <div key={item._id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>{item.name}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>₹{item.price} • <span style={{ fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span></p>
                      </div>
                      <button
                        onClick={() => handleDeleteMenuItem(item._id)}
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}