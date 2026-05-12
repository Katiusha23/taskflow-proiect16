import { useAuth } from "../context/AuthContext";

export default function Navbar({ onAdd }) {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-indigo-900 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          {user && (
            <span className="hidden sm:inline text-indigo-200 text-sm">
              — Buna, {user.username}!
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-white text-indigo-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
          >
            <span className="text-lg leading-none">+</span>
            <span>Sarcina noua</span>
          </button>
          <button
            onClick={logout}
            className="text-indigo-200 hover:text-white text-sm transition"
          >
            Iesire
          </button>
        </div>
      </div>
    </nav>
  );
}
