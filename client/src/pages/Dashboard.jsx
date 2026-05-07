import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import { analyticsAPI, taskAPI } from '../api';
import { useAuthStore } from '../store';

const STATUS_COLORS = {
  todo: '#94a3b8',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
};

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
};

function StatCard({ label, value, accent = 'bg-slate-900' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      <div className={`h-1 w-10 mt-2 rounded ${accent}`} />
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      const res = await analyticsAPI.dashboard();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 20000);
    return () => clearInterval(i);
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500 text-sm">Loading dashboard…</p>;

  const statusData = data.tasksByStatus.map((s) => ({
    name: s._id,
    value: s.count,
  }));

  const priorityData = data.tasksByPriority.map((p) => ({
    name: p._id,
    value: p.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Projects" value={data.totals.projects} accent="bg-slate-700" />
        <StatCard label="Members" value={data.totals.members} accent="bg-blue-500" />
        <StatCard label="Tasks" value={data.totals.tasks} accent="bg-indigo-500" />
        <StatCard label="Completed" value={data.totals.completedTasks} accent="bg-green-500" />
        <StatCard label="Overdue" value={data.totals.overdueTasks} accent="bg-red-500" />
        <StatCard label="Completion" value={`${data.totals.completionRate}%`} accent="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tasks by status</h3>
          {statusData.length === 0 ? (
            <p className="text-xs text-slate-400">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tasks by priority</h3>
          {priorityData.length === 0 ? (
            <p className="text-xs text-slate-400">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Member workload</h3>
        {data.memberWorkload.length === 0 ? (
          <p className="text-xs text-slate-400">No tasks have been assigned yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.memberWorkload}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total" />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MemberDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await taskAPI.list();
        setTasks(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const i = setInterval(fetch, 20000);
    return () => clearInterval(i);
  }, []);

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed',
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Assigned to me" value={total} />
        <StatCard label="In progress" value={inProgress} accent="bg-blue-500" />
        <StatCard label="Completed" value={completed} accent="bg-green-500" />
        <StatCard label="Overdue" value={overdue} accent="bg-red-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Upcoming tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing assigned to you yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.slice(0, 6).map((t) => (
              <li key={t._id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.projectId?.title || '—'}
                    {t.dueDate && ` · due ${new Date(t.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <span className="text-xs text-slate-600 capitalize">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
        </h1>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? 'Overview of all projects, tasks, and team workload.'
            : 'A quick summary of the tasks assigned to you.'}
        </p>
      </div>

      {isAdmin ? <AdminDashboard /> : <MemberDashboard />}
    </div>
  );
}
