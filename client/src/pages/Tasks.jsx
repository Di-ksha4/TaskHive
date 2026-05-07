import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

import { taskAPI, projectAPI } from '../api';
import { useAuthStore } from '../store';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_BADGE = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-700',
};

const STATUS_BADGE = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const emptyForm = {
  title: '',
  description: '',
  projectId: '',
  assignedTo: '',
  priority: '',
  dueDate: '',
};

export default function Tasks() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', projectId: 'all' });
  const [openCommentsFor, setOpenCommentsFor] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([taskAPI.list(), projectAPI.list()]);
      setTasks(tRes.data);
      setProjects(pRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === form.projectId),
    [projects, form.projectId],
  );

  const assignableMembers = useMemo(() => {
    if (!selectedProject) return [];
    return (selectedProject.members || []).filter((m) => m.role !== 'admin');
  }, [selectedProject]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter.status !== 'all' && t.status !== filter.status) return false;
      if (filter.projectId !== 'all' && t.projectId?._id !== filter.projectId) return false;
      return true;
    });
  }, [tasks, filter]);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId || !form.assignedTo) {
      toast.error('Title, project, and assignee are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: form.projectId,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate || undefined,
      };
      if (form.priority) payload.priority = form.priority;

      const res = await taskAPI.create(payload);
      toast.success(
        form.priority
          ? 'Task created'
          : `Task created (priority auto-set to ${res.data.suggestedPriority})`,
      );
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskAPI.update(taskId, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.remove(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;
    try {
      const res = await taskAPI.addComment(taskId, commentText.trim());
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      setCommentText('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const heading = isAdmin ? 'All Tasks' : 'My Tasks';
  const emptyMsg = isAdmin
    ? 'No tasks yet. Create one to get started.'
    : 'You have no tasks assigned right now.';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{heading}</h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? 'Create tasks, assign them to project members, and track progress.'
              : 'Update the status of tasks assigned to you. Your changes are visible to admins.'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setForm(emptyForm);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> {showForm ? 'Close' : 'New task'}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Fix login redirect"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value, assignedTo: '' })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional details"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assign to</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                disabled={!form.projectId}
                required
              >
                <option value="">
                  {form.projectId ? 'Select a member' : 'Pick a project first'}
                </option>
                {assignableMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
              {form.projectId && assignableMembers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  This project has no members yet — add some on the Projects page.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto (suggested)</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create task'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded bg-white"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={filter.projectId}
          onChange={(e) => setFilter({ ...filter, projectId: e.target.value })}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded bg-white"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading tasks…</p>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-slate-500">
          {emptyMsg}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{task.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${PRIORITY_BADGE[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${STATUS_BADGE[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Project: <strong className="text-slate-700">{task.projectId?.title || '—'}</strong></span>
                    {isAdmin && (
                      <span>Assigned to: <strong className="text-slate-700">{task.assignedTo?.name || 'Unassigned'}</strong></span>
                    )}
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCommentsFor(openCommentsFor === task._id ? null : task._id);
                      setCommentText('');
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    title="Comments"
                  >
                    <MessageSquare size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(task._id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {openCommentsFor === task._id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Comments</h4>
                  {(!task.comments || task.comments.length === 0) && (
                    <p className="text-xs text-slate-400 mb-2">No comments yet.</p>
                  )}
                  <div className="space-y-2 mb-3">
                    {task.comments?.map((c) => (
                      <div key={c._id || c.createdAt} className="bg-slate-50 px-3 py-2 rounded text-sm">
                        <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                          <span className="font-medium text-slate-700">{c.userId?.name || 'User'}</span>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment…"
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(task._id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(task._id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-sm"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
