import React, { useState, useEffect } from 'react';

export default function KitchenDashboardPage({ socket }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_order', (newOrder) => {
        setOrders((prev) => [...prev, newOrder]);
      });
    }
  }, [socket]);

  const updateStatus = (token, newStatus) => {
    const updated = orders.map((o) => o.token === token ? { ...o, status: newStatus } : o);
    setOrders(updated);
    if (socket) {
      socket.emit('update_status', { token, status: newStatus });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Kitchen Real-Time Orders</h2>
      {orders.length === 0 ? <p>No active orders.</p> : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {orders.map((order) => (
            <div key={order.token} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#fff' }}>
              <h3>Token #{order.token}</h3>
              <p><strong>Items:</strong> {order.items}</p>
              <p><strong>Total:</strong> ₹{order.total}</p>
              <p>Status: <span style={{ color: '#007bff', fontWeight: 'bold' }}>{order.status}</span></p>
              <button onClick={() => updateStatus(order.token, 'Preparing')} style={{ marginRight: '10px', padding: '6px 12px' }}>Mark Preparing</button>
              <button onClick={() => updateStatus(order.token, 'Ready for Pickup')} style={{ padding: '6px 12px' }}>Mark Ready</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}