/**
 * @module routes/auth
 * @description Rute pentru autentificarea utilizatorilor (register / login).
 * Parola este stocata ca hash bcrypt — niciodata in clar.
 * La autentificare reusita se emite un JWT valabil 7 zile.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

/** URL-ul intern al json-server (nu este expus frontend-ului) */
const JSON_SERVER_URL = "http://localhost:3001";

// ── Scheme de validare Joi ────────────────────────────────────────────────────

/** Valideaza datele trimise la inregistrare */
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/** Valideaza datele trimise la autentificare */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Rute ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creeaza un utilizator nou dupa validarea datelor si unicitatea email-ului.
 * Returneaza token JWT + datele publice ale utilizatorului.
 */
router.post("/register", async (req, res) => {
  // Validare structura cerere
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, email, password } = req.body;

  try {
    // Verificam unicitatea email-ului in baza de date
    const usersRes = await fetch(
      `${JSON_SERVER_URL}/users?email=${encodeURIComponent(email)}`
    );
    const existingUsers = await usersRes.json();

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Email-ul este deja inregistrat" });
    }

    // Hash parola cu bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword, // stocam doar hash-ul, niciodata parola in clar
      createdAt: new Date().toISOString(),
    };

    // Salvam utilizatorul in json-server
    const createRes = await fetch(`${JSON_SERVER_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const savedUser = await createRes.json();

    // Generam token JWT cu datele publice ale utilizatorului
    const token = jwt.sign(
      { id: savedUser.id, username: savedUser.username, email: savedUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Returnam token + date publice (fara parola)
    res.status(201).json({
      token,
      user: { id: savedUser.id, username: savedUser.username, email: savedUser.email },
    });
  } catch (err) {
    console.error("Eroare register:", err);
    res.status(500).json({ error: "Eroare interna la inregistrare" });
  }
});

/**
 * POST /api/auth/login
 * Autentifica un utilizator existent prin compararea parolei cu hash-ul bcrypt.
 * Returneaza token JWT + datele publice ale utilizatorului.
 */
router.post("/login", async (req, res) => {
  // Validare structura cerere
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // Cautam utilizatorul dupa email
    const usersRes = await fetch(
      `${JSON_SERVER_URL}/users?email=${encodeURIComponent(email)}`
    );
    const users = await usersRes.json();

    // Mesaj generic pentru a nu dezvalui daca email-ul exista sau nu
    if (users.length === 0) {
      return res.status(401).json({ error: "Email sau parola incorecte" });
    }

    const user = users[0];

    // Comparam parola trimisa cu hash-ul stocat
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Email sau parola incorecte" });
    }

    // Generam token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Eroare login:", err);
    res.status(500).json({ error: "Eroare interna la autentificare" });
  }
});

module.exports = router;
