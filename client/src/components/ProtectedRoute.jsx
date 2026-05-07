import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function ProtectedRoute({ children, requiredRole }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}
