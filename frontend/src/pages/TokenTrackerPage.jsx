import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function TokenTrackerPage({ socket }) {
  const { tokenId } = useParams();
  const [status, setStatus] = useState('Received');

  useEffect(() => {
    if (socket) {
      socket.on('status_updated', (data) => {
        if (data.token.toString() === tokenId.toString()) {
          setStatus(data.status);
        }
      });
    }
  }, [socket, tokenId]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Your Token Number</h2>
      <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#007bff', margin: '10px 0' }}>
        #{tokenId}
      </div>
      <div style={{ fontSize: '20px', padding: '12px 24px', background: '#e9ecef', borderRadius: '20px', display: 'inline-block' }}>
        Live Status: <strong>{status}</strong>
      </div>
    </div>
  );
}