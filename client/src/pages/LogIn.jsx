import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { authAPI } from '../api';
import { useAuthStore } from '../store';

export default function LogIn() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}`);
      navigate(res.data.user.role === 'admin' ? '/dashboard' : '/tasks');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">TaskHive</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded font-medium transition disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-4 text-center">
          New here? <Link to="/signup" className="text-blue-600 hover:underline">Create an account</Link>
        </p>

        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">Demo accounts</p>
          <p>Admin: admin@taskhive.com / admin123</p>
          <p>Member: john@taskhive.com / member123</p>
        </div>
      </div>
    </div>
  );
}
