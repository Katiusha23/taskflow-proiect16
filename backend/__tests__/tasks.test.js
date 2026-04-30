/**
 * @file tasks.test.js
 * @description Teste unitare pentru rutele CRUD ale sarcinilor (/api/tasks).
 * fetch() si JWT sunt mock-uite pentru izolarea testelor de serviciile externe.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const taskRoutes = require("../routes/tasks");
const { JWT_SECRET } = require("../middleware/auth");

// Aplicatie Express minimala pentru teste
const app = express();
app.use(express.json());
app.use("/api/tasks", taskRoutes);

// ── Utilitare ─────────────────────────────────────────────────────────────────

/** Genereaza un token JWT valid pentru utilizatorul de test */
const TEST_USER = { id: "user-test-123", username: "tester", email: "tester@test.com" };
const validToken = () => `Bearer ${jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: "1h" })}`;

/** Sarcina de test */
const mockTask = {
  id: "task-001",
  userId: TEST_USER.id,
  title: "Sarcina de test",
  description: "Descriere test",
  category: "work",
  priority: "high",
  dueDate: "2026-12-31",
  completed: false,
  order: 0,
  createdAt: new Date().toISOString(),
};

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── Autentificare ─────────────────────────────────────────────────────────────

describe("Protectie JWT", () => {
  test("GET /api/tasks returneaza 401 fara token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  test("GET /api/tasks returneaza 401 cu token invalid", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", "Bearer token_invalid");
    expect(res.status).toBe(401);
  });
});

// ── GET /api/tasks ────────────────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  test("returneaza lista sarcinilor utilizatorului autentificat", async () => {
    global.fetch.mockResolvedValueOnce({ json: async () => [mockTask] });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", validToken());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].userId).toBe(TEST_USER.id);
  });

  test("returneaza lista sortata dupa prioritate", async () => {
    const taskLow = { ...mockTask, id: "t1", priority: "low", order: 0 };
    const taskHigh = { ...mockTask, id: "t2", priority: "high", order: 1 };

    global.fetch.mockResolvedValueOnce({ json: async () => [taskLow, taskHigh] });

    const res = await request(app)
      .get("/api/tasks?sort=priority")
      .set("Authorization", validToken());

    expect(res.status).toBe(200);
    // high trebuie sa fie primul dupa sortare
    expect(res.body[0].priority).toBe("high");
  });
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────

describe("POST /api/tasks", () => {
  test("returneaza 400 daca titlul este gol", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", validToken())
      .send({ title: "", category: "work", priority: "medium" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("returneaza 400 daca categoria lipseste", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", validToken())
      .send({ title: "Sarcina valida", priority: "medium" });

    expect(res.status).toBe(400);
  });

  test("creeaza sarcina noua cu succes", async () => {
    // Mock: lista existenta (pentru calculul order-ului)
    global.fetch
      .mockResolvedValueOnce({ json: async () => [] })
      // Mock: raspuns de la json-server dupa creare
      .mockResolvedValueOnce({ json: async () => ({ ...mockTask, id: "task-nou", title: "Sarcina noua" }) });

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", validToken())
      .send({
        title: "Sarcina noua",
        category: "personal",
        priority: "low",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Sarcina noua");
  });
});

// ── PATCH /api/tasks/:id/toggle ───────────────────────────────────────────────

describe("PATCH /api/tasks/:id/toggle", () => {
  test("inverseaza starea completed a sarcinii", async () => {
    const updatedTask = { ...mockTask, completed: true };

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTask })
      .mockResolvedValueOnce({ json: async () => updatedTask });

    const res = await request(app)
      .patch(`/api/tasks/${mockTask.id}/toggle`)
      .set("Authorization", validToken());

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test("returneaza 403 daca sarcina apartine altui utilizator", async () => {
    const altUserTask = { ...mockTask, userId: "alt-user-999" };

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => altUserTask });

    const res = await request(app)
      .patch(`/api/tasks/${mockTask.id}/toggle`)
      .set("Authorization", validToken());

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

describe("DELETE /api/tasks/:id", () => {
  test("sterge sarcina cu succes", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTask })
      .mockResolvedValueOnce({}); // raspuns DELETE

    const res = await request(app)
      .delete(`/api/tasks/${mockTask.id}`)
      .set("Authorization", validToken());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/stearsa/i);
  });

  test("returneaza 403 la stergerea sarcinii altui utilizator", async () => {
    const altUserTask = { ...mockTask, userId: "hacker-456" };

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => altUserTask });

    const res = await request(app)
      .delete(`/api/tasks/${mockTask.id}`)
      .set("Authorization", validToken());

    expect(res.status).toBe(403);
  });

  test("returneaza 404 daca sarcina nu exista", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const res = await request(app)
      .delete("/api/tasks/id-inexistent")
      .set("Authorization", validToken());

    expect(res.status).toBe(404);
  });
});
