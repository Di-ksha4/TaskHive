import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';

import { useAuthStore } from '../store';
import { notificationAPI } from '../api';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === 'admin';

  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.list();
      setNotifications(res.data);
    } catch {
      // ignore — token errors are handled by axios interceptor
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/projects', label: 'Projects' },
        { path: '/tasks', label: 'All Tasks' },
        { path: '/profile', label: 'Profile' },
      ]
    : [
        { path: '/tasks', label: 'My Tasks' },
        { path: '/projects', label: 'My Projects' },
        { path: '/profile', label: 'Profile' },
      ];

  return (
    <nav className="bg-slate-900 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-tight">
          TaskHive <span className="text-xs text-slate-400">/{isAdmin ? 'admin' : 'member'}</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm hover:text-amber-300 transition ${
                location.pathname === link.path ? 'text-amber-300 font-medium' : 'text-slate-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setBellOpen((v) => !v)}
              className="relative p-1.5 hover:bg-slate-800 rounded transition"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-md shadow-lg overflow-hidden z-20 border border-slate-200">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-sm text-slate-500 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-3 py-2 border-b last:border-b-0 text-sm ${
                          n.isRead ? 'bg-white' : 'bg-blue-50'
                        }`}
                      >
                        <p className="text-slate-700">{n.message}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="hidden sm:inline text-sm text-slate-300">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
