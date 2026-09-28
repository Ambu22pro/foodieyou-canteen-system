import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function StaffDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [prepTimeInputs, setPrepTimeInputs] = useState({});
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  const fetchStaffOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.map(o => ({ ...o, createdAt: o.createdAt ? new Date(o.createdAt) : new Date() })));
      }
    } catch (err) {
      console.error('Error fetching staff orders:', err);
    }
  };

  useEffect(() => {
    fetchStaffOrders();

    socket.on('connect', () => setIsLiveConnected(true));
    socket.on('disconnect', () => setIsLiveConnected(false));

    socket.on('new_order', (newOrder) => {
      setOrders(prev => [{ ...newOrder, createdAt: new Date() }, ...prev]);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio error:', e));
      } catch (err) { console.error(err); }
    });

    socket.on('order_status_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.tokenNumber === updatedOrder.tokenNumber ? { ...o, ...updatedOrder } : o));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  const handleUpdateStatus = async (tokenNumber, newStatus, estTime = null) => {
    try {
      const payload = { status: newStatus };
      if (estTime) payload.estimatedTime = estTime;

      const res = await fetch(`http://localhost:5000/api/orders/${tokenNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setOrders(prev => prev.map(o => o.tokenNumber.toString() === tokenNumber.toString() ? { ...o, ...data } : o));
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const status = (order.status || 'pending').toLowerCase();
    const matchesTab = 
      filterTab === 'all' ? true :
      filterTab === 'pending' ? (status === 'pending' || status === 'preparing') :
      filterTab === 'ready' ? (status === 'ready') :
      filterTab === 'completed' ? (status === 'completed' || status === 'fulfilled') : true;

    const matchesSearch = 
      order.tokenNumber?.toString().includes(searchQuery) ||
      order.studentName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const pendingCount = orders.filter(o => !o.status || o.status === 'pending' || o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'fulfilled').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', color: '#1f2937', padding: '32px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Professional Clean Header (Matching Login Theme) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', background: '#ffffff', padding: '20px 28px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>FoodieYou Staff Portal</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isLiveConnected ? '#dcfce7' : '#fee2e2', color: isLiveConnected ? '#166534' : '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLiveConnected ? '#16a34a' : '#dc2626', display: 'inline-block' }}></span>
                {isLiveConnected ? 'Live Synced' : 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Staff Supervisor: <b>{user?.name || 'Canteen Staff'}</b> | JIET Campus</p>
          </div>

          <button 
            onClick={onLogout} 
            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
          >
            Sign Out 🚪
          </button>
        </div>

        {/* Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Pending Queue</p>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706', margin: 0 }}>{pendingCount}</h3>
          </div>
          <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Ready for Pickup</p>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7', margin: 0 }}>{readyCount}</h3>
          </div>
          <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Fulfilled Orders</p>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{completedCount}</h3>
          </div>
          <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Total Volume</p>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{orders.length}</h3>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'ready', label: `Ready (${readyCount})` },
              { id: 'completed', label: `Completed (${completedCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer', backgroundColor: filterTab === tab.id ? '#1f2937' : '#f3f4f6', color: filterTab === tab.id ? '#ffffff' : '#4b5563', transition: 'all 0.2s' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              placeholder="🔍 Search Token # or Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', color: '#1f2937', padding: '10px 16px', borderRadius: '10px', outline: 'none', width: '280px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Orders Grid */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>Live Active Order Queue</h2>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No matching orders in this queue.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredOrders.map((order, idx) => {
                const status = (order.status || 'pending').toLowerCase();
                const isCompleted = status === 'completed' || status === 'fulfilled';
                const isReady = status === 'ready';

                return (
                  <div key={idx} style={{ backgroundColor: '#ffffff', border: `1px solid ${isCompleted ? '#bbf7d0' : isReady ? '#bae6fd' : '#e5e7eb'}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div>
                      {/* Card Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ backgroundColor: '#f97316', color: '#ffffff', fontWeight: 'bold', fontSize: '16px', padding: '6px 12px', borderRadius: '8px' }}>
                            #{order.tokenNumber}
                          </span>
                          <span style={{ fontSize: '12px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontWeight: '500' }}>
                            {order.diningOption || 'Takeaway'}
                          </span>
                        </div>

                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: isCompleted ? '#dcfce7' : isReady ? '#e0f2fe' : '#fef3c7', color: isCompleted ? '#166534' : isReady ? '#0369a1' : '#92400e', textTransform: 'uppercase' }}>
                          {order.status || 'Pending'}
                        </span>
                      </div>

                      {/* Student Info & Estimated Time */}
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' }}>Student: {order.studentName || 'Student User'}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Placed At: {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                        {order.estimatedTime && (
                          <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', margin: '4px 0 0 0' }}>⏱️ Est. Prep Time: {order.estimatedTime}</p>
                        )}
                      </div>

                      {/* Items */}
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Items Ordered:</p>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', margin: '4px 0' }}>
                            <span>• {item.name} <b style={{ color: '#f97316' }}>×{item.quantity || item.qty}</b></span>
                            <span style={{ fontWeight: '600' }}>₹{item.price * (item.quantity || item.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Prep Time Input & Actions */}
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Total</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f97316' }}>₹{order.total}</span>
                      </div>

                      {!isCompleted && !isReady && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          <input
                            type="text"
                            placeholder="e.g. 15 mins"
                            value={prepTimeInputs[order.tokenNumber] || ''}
                            onChange={(e) => setPrepTimeInputs({ ...prepTimeInputs, [order.tokenNumber]: e.target.value })}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
                          />
                          <button
                            onClick={() => {
                              const t = prepTimeInputs[order.tokenNumber] || '10 mins';
                              handleUpdateStatus(order.tokenNumber, 'preparing', t);
                            }}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                          >
                            Set Time ⏰
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {!isCompleted && !isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.tokenNumber, 'ready')}
                            style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                          >
                            Mark Ready 🔔
                          </button>
                        )}

                        {!isCompleted ? (
                          <button
                            onClick={() => handleUpdateStatus(order.tokenNumber, 'completed')}
                            style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                          >
                            Complete ✅
                          </button>
                        ) : (
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', padding: '6px 12px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                            Fulfilled ✔️
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}