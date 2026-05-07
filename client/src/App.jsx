import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store';
import { authAPI } from './api';

import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token && !user) {
      authAPI.getProfile()
        .then((res) => setUser(res.data))
        .catch(() => {});
    }
  }, [token, user, setUser]);

  const homeRedirect = () => {
    if (!token) return <Navigate to="/login" replace />;
    return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/tasks'} replace />;
  };

  return (
    <Router>
      <Toaster position="top-right" />
      {token && <Navbar />}
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/" element={homeRedirect()} />
        <Route path="*" element={homeRedirect()} />
      </Routes>
    </Router>
  );
}

export default App;
