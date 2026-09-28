import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('menu');
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [diningOption, setDiningOption] = useState('Takeaway');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  const fetchStudentData = async () => {
    try {
      const resMenu = await fetch('http://localhost:5000/api/menu');
      const dataMenu = await resMenu.json();
      if (Array.isArray(dataMenu)) setMenu(dataMenu);

      const resOrders = await fetch('http://localhost:5000/api/orders');
      const dataOrders = await resOrders.json();
      if (Array.isArray(dataOrders)) {
        setOrders(dataOrders.map(o => ({ ...o, createdAt: o.createdAt ? new Date(o.createdAt) : new Date() })));
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  useEffect(() => {
    fetchStudentData();

    socket.on('connect', () => setIsLiveConnected(true));
    socket.on('disconnect', () => setIsLiveConnected(false));

    socket.on('menu_updated', (updatedMenu) => {
      setMenu(updatedMenu);
    });

    socket.on('new_order', (newOrder) => {
      setOrders(prev => [{ ...newOrder, createdAt: new Date() }, ...prev]);
    });

    socket.on('order_status_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.tokenNumber === updatedOrder.tokenNumber ? { ...o, ...updatedOrder } : o));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('menu_updated');
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  // Multi-item cart selection without state overwrite bug
  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(ci => ci._id === item._id);
      if (existing) {
        return prevCart.map(ci => 
          ci._id === item._id ? { ...ci, quantity: (ci.quantity || ci.qty || 1) + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.price * (curr.quantity || curr.qty || 1)), 0);

  const handlePaymentAndOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderPayload = {
        studentName: user?.name || 'Student User',
        diningOption: diningOption,
        items: cart,
        total: totalAmount
      };

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      
      setShowQRModal(false);
      setCart([]);
      setActiveTab('tracker');
      alert(`Payment Verified! Order confirmed with Token Number #${data.tokenNumber}`);
      fetchStudentData();
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Payment gateway connection error.');
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Elite Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', background: '#ffffff', padding: '24px 32px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>FoodieYou Student Portal</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isLiveConnected ? '#f0fdf4' : '#fef2f2', color: isLiveConnected ? '#16a34a' : '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: `1px solid ${isLiveConnected ? '#bbf7d0' : '#fecaca'}` }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLiveConnected ? '#22c55e' : '#ef4444', display: 'inline-block' }}></span>
                {isLiveConnected ? 'LIVE SYNC' : 'OFFLINE'}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Welcome back, <b>{user?.name || 'Student User'}</b> • JIET Campus Canteen</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('menu')}
              style={{ backgroundColor: activeTab === 'menu' ? '#0f172a' : '#f1f5f9', color: activeTab === 'menu' ? '#ffffff' : '#475569', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s' }}
            >
              🍽️ Smart Menu
            </button>
            <button 
              onClick={() => setActiveTab('tracker')}
              style={{ backgroundColor: activeTab === 'tracker' ? '#0f172a' : '#f1f5f9', color: activeTab === 'tracker' ? '#ffffff' : '#475569', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s' }}
            >
              📌 Live Tracker
            </button>
            <button 
              onClick={onLogout} 
              style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
            >
              Sign Out 🚪
            </button>
          </div>
        </div>

        {activeTab === 'menu' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2.6fr 1.4fr', gap: '28px' }}>
            
            {/* Left Column: Search & Menu Grid */}
            <div>
              {/* Search & Categories */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search delicious food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', marginBottom: '16px', backgroundColor: '#f8fafc', boxSizing: 'border-box', color: '#0f172a' }}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['All', 'Fast Food', 'South Indian', 'Beverages', 'Chinese', 'Snacks'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ padding: '8px 18px', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '700', fontSize: '13px', backgroundColor: selectedCategory === cat ? '#f97316' : '#ffffff', color: selectedCategory === cat ? '#ffffff' : '#475569', transition: 'all 0.2s' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {filteredMenu.map(item => (
                  <div key={item._id} style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e2e8f0', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}>
                    <div>
                      <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.category}</span>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '12px 0 6px 0', color: '#0f172a' }}>{item.name}</h3>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Stock Left: <b style={{ color: '#0f172a' }}>{item.stock || item.left || 25}</b></p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#f97316' }}>₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Dining & Cart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Dining Option */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', color: '#0f172a' }}>📍 Select Dining Mode</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => setDiningOption('Takeaway')}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '700', cursor: 'pointer', fontSize: '14px', backgroundColor: diningOption === 'Takeaway' ? '#f97316' : '#ffffff', color: diningOption === 'Takeaway' ? '#ffffff' : '#475569', transition: 'all 0.2s' }}
                  >
                    Takeaway
                  </button>
                  <button
                    onClick={() => setDiningOption('Dine-In')}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '700', cursor: 'pointer', fontSize: '14px', backgroundColor: diningOption === 'Dine-In' ? '#f97316' : '#ffffff', color: diningOption === 'Dine-In' ? '#ffffff' : '#475569', transition: 'all 0.2s' }}
                  >
                    Dine-In (QR)
                  </button>
                </div>
              </div>

              {/* Cart Summary */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>🛒 Your Food Cart</h3>
                
                {cart.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>Your cart is currently empty.</p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
                      {cart.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                          <div>
                            <p style={{ fontWeight: '800', margin: 0, fontSize: '14px', color: '#0f172a' }}>{item.name}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>₹{item.price} × {item.quantity || item.qty}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>₹{item.price * (item.quantity || item.qty)}</span>
                            <button 
                              onClick={() => removeFromCart(item._id)}
                              style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>Total Amount:</span>
                      <span style={{ fontWeight: '800', fontSize: '22px', color: '#f97316' }}>₹{totalAmount}</span>
                    </div>

                    <button
                      onClick={() => setShowQRModal(true)}
                      style={{ width: '100%', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)' }}
                    >
                      Proceed to Pay 💳
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* Live Order Tracker Tab */
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: '#0f172a' }}>📌 Live Order Tracker</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontSize: '15px' }}>No active orders found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                {orders.map((order, idx) => {
                  const status = (order.status || 'pending').toLowerCase();
                  const isCompleted = status === 'completed' || status === 'fulfilled';
                  const isReady = status === 'ready';

                  return (
                    <div key={idx} style={{ padding: '24px', border: `1px solid ${isCompleted ? '#bbf7d0' : isReady ? '#bae6fd' : '#e2e8f0'}`, borderRadius: '20px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Token #{order.tokenNumber}</h4>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', backgroundColor: isCompleted ? '#dcfce7' : isReady ? '#e0f2fe' : '#fef3c7', color: isCompleted ? '#166534' : isReady ? '#0369a1' : '#92400e', textTransform: 'uppercase' }}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0' }}><b>Dining Mode:</b> {order.diningOption || 'Takeaway'}</p>
                      {order.estimatedTime && (
                        <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '700', margin: '4px 0' }}>⏱️ Est. Prep Time: {order.estimatedTime}</p>
                      )}
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px 0' }}><b>Total:</b> ₹{order.total}</p>
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        {order.items?.map((itm, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', margin: '4px 0' }}>
                            <span>• {itm.name} (×{itm.quantity || itm.qty})</span>
                            <span style={{ fontWeight: '700' }}>₹{itm.price * (itm.quantity || itm.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* UPI QR Code Modal */}
        {showQRModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#ffffff', padding: '36px', borderRadius: '24px', width: '380px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Scan UPI QR Code</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Pay <b>₹{totalAmount}</b> via GPay, PhonePe or Paytm</p>
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=canteen@jiet&pn=FoodieYou&am=${totalAmount}`} 
                alt="UPI QR Code" 
                style={{ margin: '0 auto 20px auto', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '8px' }}
              />

              <button
                onClick={handlePaymentAndOrder}
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}
              >
                Payment Done ✅ (Confirm Order)
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                style={{ width: '100%', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}