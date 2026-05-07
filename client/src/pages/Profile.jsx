import React from 'react';
import { useAuthStore } from '../store';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <p className="p-6 text-slate-500">Loading profile…</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Profile</h1>
      <p className="text-sm text-slate-500 mb-6">Your account details.</p>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-semibold">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <dl className="text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-800 capitalize font-medium">{user.role}</dd>
          </div>
          {user.createdAt && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">Member since</dt>
              <dd className="text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
          )}
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Account ID</dt>
            <dd className="text-slate-400 text-xs font-mono">{user.id || user._id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
