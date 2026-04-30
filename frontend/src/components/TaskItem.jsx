import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CATEGORY_STYLES = {
  work:     "bg-blue-100 text-blue-700",
  personal: "bg-purple-100 text-purple-700",
  shopping: "bg-pink-100 text-pink-700",
  health:   "bg-green-100 text-green-700",
  other:    "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS = {
  work: "Munca", personal: "Personal", shopping: "Cumparaturi",
  health: "Sanatate", other: "Altele",
};

const PRIORITY_STYLES = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const PRIORITY_LABELS = { high: "Ridicata", medium: "Medie", low: "Scazuta" };

function getDueDateInfo(dueDate, completed) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (completed) {
    return { label: format(date, "d MMM yyyy", { locale: ro }), cls: "text-slate-400" };
  }
  if (isPast(date) && !isToday(date)) {
    return { label: `Depasita cu ${Math.abs(differenceInDays(date, new Date()))}z`, cls: "text-red-600 font-semibold" };
  }
  if (isToday(date)) {
    return { label: "Azi!", cls: "text-orange-600 font-semibold" };
  }
  const diff = differenceInDays(date, new Date());
  if (diff <= 3) {
    return { label: `In ${diff} zile`, cls: "text-amber-600 font-medium" };
  }
  return { label: format(date, "d MMM yyyy", { locale: ro }), cls: "text-slate-500" };
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dueDateInfo = getDueDateInfo(task.dueDate, task.completed);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border p-4 flex gap-3 items-start group transition-shadow hover:shadow-md
        ${task.completed ? "border-slate-200 opacity-70" : "border-slate-200"}
        ${dueDateInfo?.cls.includes("red") && !task.completed ? "border-l-4 border-l-red-400" : ""}
      `}
    >
      {/* Handle drag */}
      <button
        {...attributes}
        {...listeners}
        className="drag-handle mt-1 text-slate-300 hover:text-slate-500 transition flex-shrink-0"
        title="Trage pentru reordonare"
      >
        ⠿
      </button>

      {/* Checkbox completat */}
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition
          ${task.completed
            ? "bg-indigo-500 border-indigo-500"
            : "border-slate-300 hover:border-indigo-400"}`}
        title={task.completed ? "Marcheaza ca activa" : "Marcheaza ca finalizata"}
      >
        {task.completed && (
          <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>
        )}
      </button>

      {/* Continut */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-slate-800 truncate ${task.completed ? "line-through text-slate-400" : ""}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[task.category]}`}>
            {CATEGORY_LABELS[task.category]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {dueDateInfo && (
            <span className={`text-xs ${dueDateInfo.cls}`}>📅 {dueDateInfo.label}</span>
          )}
        </div>
      </div>

      {/* Actiuni */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Editeaza"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Sterge"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
