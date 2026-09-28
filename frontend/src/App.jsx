import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';

const socket = io('http://localhost:5000');

function App() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('foodieyou_view') || 'login';
  });
  
  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('foodieyou_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));

    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));

    socket.on('user_registered', (newUser) => {
      setUsers(prev => [...prev, newUser]);
    });

    socket.on('user_status_updated', (updatedUser) => {
      setUsers(prev => prev.map(u => (u.id === updatedUser.id || u._id === updatedUser._id) ? updatedUser : u));
    });

    socket.on('user_deleted', (deletedId) => {
      setUsers(prev => prev.filter(u => u.id != deletedId && u._id != deletedId));
    });

    socket.on('new_order', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
    });

    socket.on('order_status_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.tokenNumber === updatedOrder.tokenNumber ? updatedOrder : o));
    });

    return () => {
      socket.off('user_registered');
      socket.off('user_status_updated');
      socket.off('user_deleted');
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  const updateSession = (view, user) => {
    setCurrentView(view);
    setActiveUser(user);
    localStorage.setItem('foodieyou_view', view);
    if (user) {
      localStorage.setItem('foodieyou_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('foodieyou_user');
    }
  };

  const handleRegisterSubmit = async (newUser) => {
    try {
      const res = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      await res.json();
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleApproveUser = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/users/${id}/approve`, {
        method: 'PUT'
      });
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleRemoveUser = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Deletion error:', err);
    }
  };

  const handlePlaceOrder = async (newOrder) => {
    try {
      const orderPayload = {
        ...newOrder,
        studentName: activeUser?.name || 'Campus Student'
      };
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
    } catch (err) {
      console.error('Order placement error:', err);
    }
  };

  const handleUpdateOrderStatus = async (tokenNumber, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${tokenNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Order status update error:', err);
    }
  };

  return (
    <div className="App">
      {currentView === 'login' && (
        <Login 
          users={users}
          onLoginSuccess={(role, user) => {
            if (role === 'student') updateSession('student', user);
            else if (role === 'staff') updateSession('staff', user);
          }}
          onAdminLogin={() => updateSession('admin', { name: 'Admin' })}
          onSwitchToRegister={() => updateSession('register', null)}
        />
      )}

      {currentView === 'register' && (
        <Register 
          onRegisterSubmit={handleRegisterSubmit}
          onSwitchToLogin={() => updateSession('login', null)}
        />
      )}

      {currentView === 'admin' && (
        <AdminDashboard 
          users={users}
          onApproveUser={handleApproveUser}
          onRemoveUser={handleRemoveUser}
          onLogout={() => {
            localStorage.clear();
            updateSession('login', null);
          }} 
        />
      )}

      {currentView === 'student' && (
        <StudentDashboard 
          currentUser={activeUser}
          onPlaceOrder={handlePlaceOrder}
          onLogout={() => {
            localStorage.clear();
            updateSession('login', null);
          }}
        />
      )}

      {currentView === 'staff' && (
        <StaffDashboard 
          incomingOrders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onLogout={() => {
            localStorage.clear();
            updateSession('login', null);
          }}
        />
      )}
    </div>
  );
}

export default App;