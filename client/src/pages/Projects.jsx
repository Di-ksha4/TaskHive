import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, X } from 'lucide-react';

import { projectAPI, userAPI } from '../api';
import { useAuthStore } from '../store';

const emptyForm = { title: '', description: '', deadline: '', members: [] };

export default function Projects() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [managingProject, setManagingProject] = useState(null);

  const fetchData = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        projectAPI.list(),
        isAdmin ? userAPI.list({ role: 'member' }) : Promise.resolve({ data: [] }),
      ]);
      setProjects(pRes.data);
      if (isAdmin) setMembers(uRes.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    setSubmitting(true);
    try {
      await projectAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: form.deadline || undefined,
        members: form.members,
      });
      toast.success('Project created');
      setForm(emptyForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? Its tasks will also be removed.')) return;
    try {
      await projectAPI.remove(id);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleAddMember = async (projectId, userId) => {
    try {
      const res = await projectAPI.addMember(projectId, userId);
      setProjects((prev) => prev.map((p) => (p._id === projectId ? res.data : p)));
      setManagingProject(res.data);
      toast.success('Member added');
    } catch {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    try {
      const res = await projectAPI.removeMember(projectId, memberId);
      setProjects((prev) => prev.map((p) => (p._id === projectId ? res.data : p)));
      setManagingProject(res.data);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isAdmin ? 'Projects' : 'My Projects'}</h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? 'Group related tasks under projects and add the right members.'
              : 'Projects you have been added to.'}
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
            <Plus size={16} /> {showForm ? 'Close' : 'New project'}
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
                placeholder="e.g. Website Redesign"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Add members</label>
            {members.length === 0 ? (
              <p className="text-xs text-slate-500">No members in the system yet. Members can sign up themselves and you can add them later.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {members.map((m) => (
                  <label
                    key={m._id}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.members.includes(m._id)}
                      onChange={() => toggleMember(m._id)}
                    />
                    <span className="text-sm text-slate-700">{m.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{m.email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create project'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setShowForm(false);
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-slate-500">
          {isAdmin ? 'No projects yet. Click “New project” to create one.' : 'You are not part of any project yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-800">{p.title}</h3>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p._id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {p.description && <p className="text-sm text-slate-600 mb-3">{p.description}</p>}

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Users size={14} />
                <span>{p.members?.length || 0} members</span>
                {p.deadline && (
                  <span>· Deadline {new Date(p.deadline).toLocaleDateString()}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {(p.members || []).slice(0, 4).map((m) => (
                  <span
                    key={m._id}
                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                  >
                    {m.name}
                  </span>
                ))}
                {p.members?.length > 4 && (
                  <span className="text-[11px] text-slate-400">+{p.members.length - 4}</span>
                )}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setManagingProject(p)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Manage members →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {managingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-30" onClick={() => setManagingProject(null)}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Manage members</h3>
                <p className="text-xs text-slate-500">{managingProject.title}</p>
              </div>
              <button type="button" onClick={() => setManagingProject(null)} className="text-slate-500 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-600 mb-2">Current members</h4>
              <div className="space-y-1 max-h-40 overflow-auto">
                {managingProject.members
                  ?.filter((m) => m.role === 'member')
                  .map((m) => (
                    <div key={m._id} className="flex justify-between items-center px-3 py-1.5 bg-slate-50 rounded text-sm">
                      <span>{m.name} <span className="text-slate-400 text-xs">{m.email}</span></span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(managingProject._id, m._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                {!managingProject.members?.some((m) => m.role === 'member') && (
                  <p className="text-xs text-slate-400">No members on this project yet.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-2">Add a member</h4>
              <div className="space-y-1 max-h-40 overflow-auto">
                {members
                  .filter((m) => !managingProject.members?.some((existing) => existing._id === m._id))
                  .map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => handleAddMember(managingProject._id, m._id)}
                      className="w-full flex justify-between items-center px-3 py-1.5 hover:bg-slate-50 rounded text-sm"
                    >
                      <span>{m.name} <span className="text-slate-400 text-xs">{m.email}</span></span>
                      <span className="text-xs text-blue-600">Add</span>
                    </button>
                  ))}
                {members.filter((m) => !managingProject.members?.some((e) => e._id === m._id)).length === 0 && (
                  <p className="text-xs text-slate-400">All available members are already added.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
