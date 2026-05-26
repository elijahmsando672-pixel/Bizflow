'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, Circle, Clock, AlertCircle, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { Modal } from '@/components/Modal';

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-amber-100 text-amber-600',
  URGENT: 'bg-red-100 text-red-600',
};

const statusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="w-5 h-5 text-slate-400" />,
  IN_PROGRESS: <Clock className="w-5 h-5 text-blue-500" />,
  DONE: <CheckCircle className="w-5 h-5 text-green-500" />,
};

const columns = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-400' },
  { id: 'DONE', title: 'Done', color: 'border-green-400' },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: tasksRaw, isLoading } = useQuery({
    queryKey: ['tasks', page],
    queryFn: () => tasksApi.getTasks({ page: String(page), limit: String(limit) }),
  });

  const allTasks = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw?.data ?? []);
  const pagination = !Array.isArray(tasksRaw) ? tasksRaw?.pagination : null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: string; dueDate?: string }) =>
      tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTarget(null);
    },
  });

  const openAdd = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'TODO' ? 'IN_PROGRESS' :
      currentStatus === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    statusMutation.mutate({ id: taskId, status: nextStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const overdue = allTasks.filter(
    (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()
  );

  const todo = allTasks.filter((t) => t.status === 'TODO');
  const inProgress = allTasks.filter((t) => t.status === 'IN_PROGRESS');
  const done = allTasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500">Manage your tasks and projects</p>
        </div>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500 mb-1">To Do</div>
          <div className="text-2xl font-bold text-slate-900">{todo.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{inProgress.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{done.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div className="text-sm text-slate-500">Overdue</div>
          </div>
          <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-slate-100 rounded-xl p-4">
            <div className={`border-t-4 ${column.color} bg-white rounded-b-lg p-4`}>
              <h3 className="font-semibold text-slate-900 mb-4">{column.title}</h3>
              <div className="space-y-3">
                {allTasks
                  .filter((t) => t.status === column.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {statusIcons[task.status]}
                          <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(task); }}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                            className="p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-slate-900 mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{task.assignedTo?.name ?? 'Unassigned'}</span>
                        {task.dueDate && (
                          <span className={
                            new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500' : ''
                          }>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                {allTasks.filter((t) => t.status === column.id).length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-4">No tasks</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <button
              disabled={page >= (pagination.totalPages ?? 1)}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Add Task'}>
        <TaskForm
          initial={editingTask}
          onSubmit={(data) => {
            if (editingTask) {
              updateMutation.mutate({ id: editingTask.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Task">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TaskForm({ initial, onSubmit, loading }: { initial?: any; onSubmit: (data: any) => void; loading: boolean }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState(initial?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.split('T')[0] : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      ...(description ? { description } : {}),
      priority,
      ...(dueDate ? { dueDate } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
