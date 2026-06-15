import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function isValidToken(token) {
  if (!token || token.split('.').length !== 3) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setAuthed(isValidToken(token));
  }, []);

  if (authed === null) return null;
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
