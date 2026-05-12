import { useState } from "react";
import api from "../api";
import { CATEGORIES, PRIORITIES } from "./FilterBar";

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.value !== "");
const PRIORITY_OPTIONS = PRIORITIES.filter((p) => p.value !== "");

export default function TaskModal({ task, onSaved, onClose }) {
  const isNew = !task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    category: task?.category || "personal",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    completed: task?.completed || false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Titlul sarcinii nu poate fi gol");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        dueDate: form.dueDate || null,
      };

      let saved;
      if (isNew) {
        const { data } = await api.post("/tasks", payload);
        saved = data;
      } else {
        const { data } = await api.put(`/tasks/${task.id}`, payload);
        saved = data;
      }
      onSaved(saved, isNew);
    } catch (err) {
      setError(err.response?.data?.error || "Eroare la salvarea sarcinii");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg opacity-75">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isNew ? "Sarcina noua" : "Editeaza sarcina"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titlu <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="Ce trebuie facut?"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descriere</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Detalii optionale..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-sm"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioritate</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-sm"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data limita</label>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {!isNew && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="completed"
                checked={form.completed}
                onChange={handleChange}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-slate-700">Marcheaza ca finalizata</span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Anuleaza
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition font-semibold"
            >
              {loading ? "Se salveaza..." : isNew ? "Adauga" : "Salveaza"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
