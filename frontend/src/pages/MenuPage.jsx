import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sampleMenu = [
  { id: '1', name: 'Veg Sandwich', price: 50, category: 'Snacks' },
  { id: '2', name: 'Cold Coffee', price: 40, category: 'Drinks' },
  { id: '3', name: 'Paneer Thali', price: 90, category: 'Meals' },
  { id: '4', name: 'Samosa', price: 15, category: 'Snacks' },
];

export default function MenuPage({ socket }) {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  const addToCart = (item) => setCart([...cart, item]);
  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = () => {
    const tokenNum = Math.floor(100 + Math.random() * 900);
    const orderData = {
      token: tokenNum,
      items: cart.map(i => i.name).join(', '),
      total: calculateTotal(),
      status: 'Received'
    };

    // Emit order to backend via WebSockets
    if (socket) {
      socket.emit('new_order', orderData);
    }

    navigate(`/tracker/${tokenNum}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Digital Menu</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {sampleMenu.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{item.name}</strong>
              <div>₹{item.price}</div>
            </div>
            <button onClick={() => addToCart(item)} style={{ padding: '6px 12px', cursor: 'pointer' }}>Add</button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Cart ({cart.length} items)</h3>
          <p>Total: <strong>₹{calculateTotal()}</strong></p>
          <button onClick={handlePlaceOrder} style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Place Order & Generate Token
          </button>
        </div>
      )}
    </div>
  );
}