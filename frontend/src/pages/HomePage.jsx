import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import FilterBar from "../components/FilterBar";
import TaskList from "../components/TaskList";
import TaskModal from "../components/TaskModal";
import ProgressRing from "../components/ProgressRing";

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    category: "", priority: "", completed: "", sort: "", date: "",
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Trimitem doar filtrele suportate de backend (fara date — filtrat client-side)
      const params = Object.fromEntries(
        Object.entries(filters).filter(([k, v]) => v !== "" && k !== "date")
      );
      const { data } = await api.get("/tasks", { params });

      // Filtrare client-side dupa data limita selectata in calendar
      const filtered = filters.date
        ? data.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === filters.date)
        : data;

      setTasks(filtered);
    } catch (err) {
      console.error("Eroare la preluarea sarcinilor:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function openAdd() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleToggle(task) {
    try {
      const { data } = await api.patch(`/tasks/${task.id}/toggle`);
      setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch (err) {
      console.error("Eroare toggle:", err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Stergi aceasta sarcina?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Eroare delete:", err);
    }
  }

  async function handleReorder(reordered) {
    setTasks(reordered);
    try {
      await api.patch("/tasks/reorder", reordered.map((t, i) => ({ id: t.id, order: i })));
    } catch (err) {
      console.error("Eroare reorder:", err);
      fetchTasks();
    }
  }

  function handleSaved(savedTask, isNew) {
    setTasks((prev) =>
      isNew ? [...prev, savedTask] : prev.map((t) => (t.id === savedTask.id ? savedTask : t))
    );
    setModalOpen(false);
  }

  // Statistici calculate functional din array-ul de sarcini
  const total   = tasks.length;
  const done    = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onAdd={openAdd} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Carduri statistici */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total sarcini" value={total}   color="indigo" />
          <StatCard label="Finalizate"    value={done}    color="green"  />
          <StatCard label="Depasite"      value={overdue} color="red"    />
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg font-medium">Nicio sarcina gasita</p>
            <p className="text-sm mt-1">
              {filters.date
                ? "Nu exista sarcini cu aceasta data limita"
                : "Adauga prima ta sarcina apasand butonul de mai sus"}
            </p>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </main>

      {/* Cerc progres fix in coltul din dreapta-jos */}
      <ProgressRing total={total} completed={done} />

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green:  "bg-green-50 text-green-700 border-green-200",
    red:    "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 font-medium">{label}</p>
    </div>
  );
}
