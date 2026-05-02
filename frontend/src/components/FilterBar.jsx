/**
 * @component FilterBar
 * @description Bara de filtrare si sortare a sarcinilor.
 * Suporta filtrare dupa: categorie, prioritate, status, data limita.
 * Suporta sortare dupa: ordine manuala, data limita, prioritate.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

export const CATEGORIES = [
  { value: "", label: "Toate categoriile" },
  { value: "work", label: "Munca" },
  { value: "personal", label: "Personal" },
  { value: "shopping", label: "Cumparaturi" },
  { value: "health", label: "Sanatate" },
  { value: "other", label: "Altele" },
];

export const PRIORITIES = [
  { value: "", label: "Orice prioritate" },
  { value: "high", label: "Ridicata" },
  { value: "medium", label: "Medie" },
  { value: "low", label: "Scazuta" },
];

const STATUSES = [
  { value: "", label: "Toate" },
  { value: "false", label: "Active" },
  { value: "true", label: "Finalizate" },
];

const SORTS = [
  { value: "", label: "Ordine manuala" },
  { value: "dueDate", label: "Data limita" },
  { value: "priority", label: "Prioritate" },
];

export default function FilterBar({ filters, onChange }) {
  function set(key, value) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    onChange({ category: "", priority: "", completed: "", sort: "", date: "" });
  }

  const isActive = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Select
          label="Categorie"
          value={filters.category}
          options={CATEGORIES}
          onChange={(v) => set("category", v)}
        />
        <Select
          label="Prioritate"
          value={filters.priority}
          options={PRIORITIES}
          onChange={(v) => set("priority", v)}
        />
        <Select
          label="Status"
          value={filters.completed}
          options={STATUSES}
          onChange={(v) => set("completed", v)}
        />
        <Select
          label="Sorteaza dupa"
          value={filters.sort}
          options={SORTS}
          onChange={(v) => set("sort", v)}
        />

        {/* Filtru calendar — afiseaza sarcinile cu data limita selectata */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-date" className="text-xs font-medium text-slate-500">
            Data limita
          </label>
          <input
            id="filter-date"
            type="date"
            value={filters.date || ""}
            onChange={(e) => set("date", e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>

        {isActive && (
          <button
            onClick={reset}
            className="text-sm text-slate-500 hover:text-red-500 transition pb-0.5"
          >
            Reseteaza
          </button>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <label htmlFor={id} className="text-xs font-medium text-slate-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
