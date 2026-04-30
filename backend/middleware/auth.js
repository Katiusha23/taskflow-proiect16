/**
 * @module middleware/auth
 * @description Middleware de autentificare JWT pentru rutele protejate.
 *
 * Fluxul de verificare:
 *  1. Citeste header-ul Authorization (format: "Bearer <token>")
 *  2. Verifica semnatura si expirarea token-ului cu JWT_SECRET
 *  3. Adauga datele utilizatorului la req.user pentru rutele urmatoare
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

const jwt = require("jsonwebtoken");

/** Cheia secreta pentru semnarea/verificarea JWT (din env sau valoare implicita pentru dev) */
const JWT_SECRET = process.env.JWT_SECRET || "todo_secret_key_2026";

/**
 * Middleware care verifica token-ul JWT din header-ul Authorization.
 * Respinge cererile fara token sau cu token invalid/expirat cu HTTP 401.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Token-ul trebuie sa fie prezent si in formatul "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token lipsa sau invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify arunca exceptie daca token-ul e expirat sau semnat gresit
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, email, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: "Token expirat sau invalid" });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
