/**
 * @file auth.test.js
 * @description Teste unitare pentru rutele de autentificare (/api/auth).
 * fetch() este mock-uit pentru a nu depinde de json-server in timpul testarii.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const request = require("supertest");
const express = require("express");
const authRoutes = require("../routes/auth");

// Aplicatie Express minimala pentru teste
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  // Inlocuim fetch global cu un mock Jest inainte de fiecare test
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── Teste POST /api/auth/register ─────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  test("returneaza 400 daca lipsesc campurile obligatorii", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("returneaza 400 daca parola are mai putin de 6 caractere", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@test.com",
      password: "123",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test("returneaza 400 daca email-ul este invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "nu-e-email",
      password: "parola123",
    });
    expect(res.status).toBe(400);
  });

  test("returneaza 409 daca email-ul este deja inregistrat", async () => {
    // Mock: email-ul exista deja in baza de date
    global.fetch.mockResolvedValueOnce({
      json: async () => [{ id: "1", email: "existent@test.com" }],
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "altuser",
      email: "existent@test.com",
      password: "parola123",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/inregistrat/i);
  });

  test("inregistreaza cu succes si returneaza token JWT", async () => {
    // Mock: nu exista utilizatori cu acest email
    global.fetch
      .mockResolvedValueOnce({ json: async () => [] })
      // Mock: json-server salveaza utilizatorul
      .mockResolvedValueOnce({
        json: async () => ({
          id: "uuid-123",
          username: "newuser",
          email: "new@test.com",
          password: "hashed",
        }),
      });

    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
      email: "new@test.com",
      password: "parola123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ username: "newuser", email: "new@test.com" });
    // Parola nu trebuie returnata niciodata
    expect(res.body.user).not.toHaveProperty("password");
  });
});

// ── Teste POST /api/auth/login ────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  test("returneaza 400 daca lipsesc campurile obligatorii", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  test("returneaza 401 daca utilizatorul nu exista", async () => {
    // Mock: nu gasim utilizatorul in baza de date
    global.fetch.mockResolvedValueOnce({ json: async () => [] });

    const res = await request(app).post("/api/auth/login").send({
      email: "inexistent@test.com",
      password: "parola123",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorecte/i);
  });

  test("returneaza 401 daca parola este gresita", async () => {
    const bcrypt = require("bcryptjs");
    // Hash pentru "parolacorecta"
    const hashedPwd = await bcrypt.hash("parolacorecta", 10);

    global.fetch.mockResolvedValueOnce({
      json: async () => [{ id: "1", email: "user@test.com", password: hashedPwd }],
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "parolagresita",
    });
    expect(res.status).toBe(401);
  });

  test("autentifica cu succes si returneaza token JWT", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPwd = await bcrypt.hash("parola123", 10);

    global.fetch.mockResolvedValueOnce({
      json: async () => [{
        id: "uuid-456",
        username: "maria",
        email: "maria@test.com",
        password: hashedPwd,
      }],
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "maria@test.com",
      password: "parola123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("maria@test.com");
    expect(res.body.user).not.toHaveProperty("password");
  });
});
