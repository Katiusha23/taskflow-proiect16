/**
 * @module routes/tasks
 * @description Rute CRUD pentru gestionarea sarcinilor (tasks).
 * Toate rutele sunt protejate prin JWT (authMiddleware).
 * Fiecare utilizator vede si modifica exclusiv propriile sarcini.
 *
 * Endpoint-uri disponibile:
 *   GET    /api/tasks            – lista sarcinilor cu filtrare si sortare
 *   POST   /api/tasks            – adauga sarcina noua
 *   PUT    /api/tasks/:id        – editeaza o sarcina existenta
 *   PATCH  /api/tasks/:id/toggle – schimba starea completata/activa
 *   PATCH  /api/tasks/reorder    – actualizeaza ordinea dupa drag & drop
 *   DELETE /api/tasks/:id        – sterge o sarcina
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const express = require("express");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/** URL-ul intern al json-server pentru colectia tasks */
const JSON_SERVER_URL = "http://localhost:3001/tasks";

// ── Scheme de validare Joi ────────────────────────────────────────────────────

/**
 * Schema pentru creare/editare sarcina.
 * Titlul este obligatoriu si nu poate fi gol (min 1 caracter).
 * Categoria si prioritatea sunt enum-uri cu valori fixe.
 */
const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow("").max(1000).optional(),
  category: Joi.string().valid("work", "personal", "shopping", "health", "other").required(),
  priority: Joi.string().valid("low", "medium", "high").required(),
  dueDate: Joi.string().isoDate().allow(null, "").optional(),
  completed: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional(),
});

/** Schema pentru operatia de reordonare (drag & drop) */
const reorderSchema = Joi.array().items(
  Joi.object({ id: Joi.string().required(), order: Joi.number().required() })
);

// Aplica authMiddleware pe toate rutele din acest router
router.use(authMiddleware);

// ── Rute ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 * Returneaza sarcinile utilizatorului autentificat.
 * Suporta filtrare prin query params: category, priority, completed.
 * Suporta sortare prin query param: sort (dueDate | priority | implicit = order manual)
 *
 * Paradigma functionala: sortarea se face cu .sort() pe array imutabil.
 */
router.get("/", async (req, res) => {
  const { category, priority, completed, sort } = req.query;
  const userId = req.user.id;

  try {
    // Construim URL-ul de filtrare pentru json-server
    let url = `${JSON_SERVER_URL}?userId=${userId}`;
    if (category)  url += `&category=${category}`;
    if (priority)  url += `&priority=${priority}`;
    if (completed !== undefined) url += `&completed=${completed}`;

    const response = await fetch(url);
    let tasks = await response.json();

    // Sortare functionala — nu modifica array-ul original
    if (sort === "dueDate") {
      // Sarcinile fara data limita merg la final
      tasks = [...tasks].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sort === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      tasks = [...tasks].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else {
      // Ordine manuala stabilita prin drag & drop
      tasks = [...tasks].sort((a, b) => a.order - b.order);
    }

    res.json(tasks);
  } catch (err) {
    console.error("Eroare get tasks:", err);
    res.status(500).json({ error: "Nu s-au putut prelua sarcinile" });
  }
});

/**
 * POST /api/tasks
 * Adauga o sarcina noua pentru utilizatorul autentificat.
 * Order-ul este calculat automat ca max(order existent) + 1.
 * Titlul gol este respins de schema Joi (min 1 caracter).
 */
router.post("/", async (req, res) => {
  // Validare date de intrare — respinge titlul gol
  const { error } = taskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Calculam order-ul urmator pe baza sarcinilor existente (paradigma functionala)
    const existingRes = await fetch(`${JSON_SERVER_URL}?userId=${req.user.id}`);
    const existingTasks = await existingRes.json();
    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order ?? 0), -1);

    const newTask = {
      id: uuidv4(),
      userId: req.user.id,       // asociem sarcina cu utilizatorul curent
      title: req.body.title.trim(),
      description: req.body.description?.trim() || "",
      category: req.body.category,
      priority: req.body.priority,
      dueDate: req.body.dueDate || null,
      completed: false,          // o sarcina noua incepe intotdeauna ca activa
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    const createRes = await fetch(JSON_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    const saved = await createRes.json();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Eroare post task:", err);
    res.status(500).json({ error: "Nu s-a putut salva sarcina" });
  }
});

/**
 * PUT /api/tasks/:id
 * Actualizeaza complet o sarcina existenta.
 * Verifica ca sarcina apartine utilizatorului autentificat (izolare date).
 */
router.put("/:id", async (req, res) => {
  const { error } = taskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const taskRes = await fetch(`${JSON_SERVER_URL}/${req.params.id}`);
    if (!taskRes.ok) return res.status(404).json({ error: "Sarcina nu a fost gasita" });

    const existingTask = await taskRes.json();

    // Verificare proprietate — un utilizator nu poate edita sarcinile altcuiva
    if (existingTask.userId !== req.user.id) {
      return res.status(403).json({ error: "Acces interzis" });
    }

    // Pastram campurile interne (id, userId, createdAt) si actualizam restul
    const updated = {
      ...existingTask,
      title: req.body.title.trim(),
      description: req.body.description?.trim() || "",
      category: req.body.category,
      priority: req.body.priority,
      dueDate: req.body.dueDate || null,
      completed: req.body.completed ?? existingTask.completed,
      order: req.body.order ?? existingTask.order,
    };

    const updateRes = await fetch(`${JSON_SERVER_URL}/${req.params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    res.json(await updateRes.json());
  } catch (err) {
    console.error("Eroare put task:", err);
    res.status(500).json({ error: "Nu s-a putut actualiza sarcina" });
  }
});

/**
 * PATCH /api/tasks/:id/toggle
 * Inverseaza starea completed a sarcinii (activa <-> finalizata).
 * Operatie atomica — nu necesita trimiterea intregului obiect.
 */
router.patch("/:id/toggle", async (req, res) => {
  try {
    const taskRes = await fetch(`${JSON_SERVER_URL}/${req.params.id}`);
    if (!taskRes.ok) return res.status(404).json({ error: "Sarcina nu a fost gasita" });

    const task = await taskRes.json();

    // Verificare proprietate
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Acces interzis" });
    }

    // Inversam starea completed
    const updated = { ...task, completed: !task.completed };

    const updateRes = await fetch(`${JSON_SERVER_URL}/${req.params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    res.json(await updateRes.json());
  } catch (err) {
    console.error("Eroare toggle task:", err);
    res.status(500).json({ error: "Nu s-a putut actualiza starea sarcinii" });
  }
});

/**
 * PATCH /api/tasks/reorder
 * Actualizeaza campul `order` pentru mai multe sarcini deodata.
 * Folosit dupa operatia de drag & drop din interfata.
 * Cererile catre json-server sunt trimise in paralel (Promise.all).
 */
router.patch("/reorder", async (req, res) => {
  const { error } = reorderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    // Actualizari paralele pentru performanta (paradigma functionala)
    const updates = req.body.map(({ id, order }) =>
      fetch(`${JSON_SERVER_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      })
    );
    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    console.error("Eroare reorder:", err);
    res.status(500).json({ error: "Nu s-a putut reordona lista" });
  }
});

/**
 * DELETE /api/tasks/:id
 * Sterge definitiv o sarcina.
 * Verifica ca sarcina apartine utilizatorului autentificat inainte de stergere.
 */
router.delete("/:id", async (req, res) => {
  try {
    const taskRes = await fetch(`${JSON_SERVER_URL}/${req.params.id}`);
    if (!taskRes.ok) return res.status(404).json({ error: "Sarcina nu a fost gasita" });

    const task = await taskRes.json();

    // Verificare proprietate — protectie impotriva stergerii sarcinilor altor utilizatori
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Acces interzis" });
    }

    await fetch(`${JSON_SERVER_URL}/${req.params.id}`, { method: "DELETE" });
    res.json({ message: "Sarcina stearsa cu succes" });
  } catch (err) {
    console.error("Eroare delete task:", err);
    res.status(500).json({ error: "Nu s-a putut sterge sarcina" });
  }
});

module.exports = router;
