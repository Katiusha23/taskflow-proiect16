/**
 * @file server.js
 * @description Punctul de intrare al serverului Express pentru TaskFlow API.
 *
 * Arhitectura:
 *  - json-server ruleaza intern pe portul 3001 (stocare date, nu e expus public)
 *  - Express ruleaza pe portul 5001 (API public consumat de frontend)
 *  - Frontend-ul (React/Vite) ruleaza pe portul 5173 si proxiaza /api catre 5001
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();

// Permite cereri cross-origin de la frontend (dev si productie)
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],
}));

app.use(express.json());

// ── Rute API ─────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);   // /api/auth/register, /api/auth/login
app.use("/api/tasks", taskRoutes);   // CRUD sarcini (protejat JWT)

/** Health check folosit de Render si pentru monitorizare */
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ── Pornire server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server TaskFlow pornit pe http://localhost:${PORT}`)
);

module.exports = app; // exportat pentru teste Jest
