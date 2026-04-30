# TaskFlow – Documentație API

API REST dezvoltat cu **Express.js**, care expune endpoint-uri pentru autentificare și gestionarea sarcinilor.  
Datele sunt stocate persistent în **json-server** (fișier `backend/db.json`).

**URL de bază (development):** `http://localhost:5001/api`  
**URL de bază (producție):** `https://<app>.onrender.com/api`

---

## Autentificare

Toate rutele `/api/tasks` necesită un **token JWT** transmis în header:

```
Authorization: Bearer <token>
```

Token-ul se obține la login sau register și este valabil **7 zile**.

---

## 1. Auth – Autentificare utilizatori

### POST `/api/auth/register`

Înregistrează un utilizator nou.

**Body (JSON):**
```json
{
  "username": "maria_i",
  "email": "maria@example.com",
  "password": "parola123"
}
```

| Câmp | Tip | Constrângeri |
|------|-----|--------------|
| username | string | 3–30 caractere, obligatoriu |
| email | string | format email valid, obligatoriu |
| password | string | minim 6 caractere, obligatoriu |

**Răspuns 201 – Succes:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "bf1cc4dd-02b2-451d-983e-97eef353c314",
    "username": "maria_i",
    "email": "maria@example.com"
  }
}
```

**Erori posibile:**
| Cod | Motiv |
|-----|-------|
| 400 | Date invalide (câmp lipsă, email incorect, parolă prea scurtă) |
| 409 | Email-ul este deja înregistrat |
| 500 | Eroare internă de server |

---

### POST `/api/auth/login`

Autentifică un utilizator existent.

**Body (JSON):**
```json
{
  "email": "maria@example.com",
  "password": "parola123"
}
```

**Răspuns 200 – Succes:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "bf1cc4dd-02b2-451d-983e-97eef353c314",
    "username": "maria_i",
    "email": "maria@example.com"
  }
}
```

**Erori posibile:**
| Cod | Motiv |
|-----|-------|
| 400 | Date invalide |
| 401 | Email sau parolă incorecte |
| 500 | Eroare internă de server |

---

## 2. Tasks – Gestionarea sarcinilor

> Toate rutele de mai jos necesită header `Authorization: Bearer <token>`.

### Model sarcină (Task)

```json
{
  "id": "1dde64ca-42bf-401d-88ec-61f402016206",
  "userId": "bf1cc4dd-02b2-451d-983e-97eef353c314",
  "title": "Proiect Tehnologii Web",
  "description": "Tema 16 – Lista de sarcini",
  "category": "work",
  "priority": "high",
  "dueDate": "2026-05-05",
  "completed": false,
  "order": 0,
  "createdAt": "2026-04-30T12:23:38.340Z"
}
```

| Câmp | Tip | Valori acceptate |
|------|-----|-----------------|
| category | string | `work`, `personal`, `shopping`, `health`, `other` |
| priority | string | `low`, `medium`, `high` |
| dueDate | string / null | format ISO 8601 (`YYYY-MM-DD`) sau `null` |
| completed | boolean | `true` / `false` |

---

### GET `/api/tasks`

Returnează toate sarcinile utilizatorului autentificat.

**Query params opționali:**
| Param | Tip | Exemplu |
|-------|-----|---------|
| category | string | `?category=work` |
| priority | string | `?priority=high` |
| completed | boolean | `?completed=false` |
| sort | string | `?sort=dueDate` sau `?sort=priority` |

**Răspuns 200:**
```json
[
  {
    "id": "1dde64ca...",
    "title": "Proiect Tehnologii Web",
    "category": "work",
    "priority": "high",
    "completed": false,
    "order": 0,
    ...
  }
]
```

---

### POST `/api/tasks`

Adaugă o sarcină nouă. Titlul gol este respins (validare Joi).

**Body (JSON):**
```json
{
  "title": "Sarcina noua",
  "description": "Detalii optionale",
  "category": "personal",
  "priority": "medium",
  "dueDate": "2026-05-10"
}
```

**Răspuns 201 – Sarcina creată:**
```json
{
  "id": "uuid-generat",
  "userId": "id-utilizator",
  "title": "Sarcina noua",
  "completed": false,
  "order": 1,
  ...
}
```

**Erori posibile:**
| Cod | Motiv |
|-----|-------|
| 400 | Titlu gol, categorie/prioritate lipsă sau invalidă |
| 401 | Token lipsă sau expirat |

---

### PUT `/api/tasks/:id`

Actualizează complet o sarcină existentă.  
Utilizatorul poate modifica **doar propriile sarcini**.

**Body (JSON):** același format ca la POST, plus câmpul `completed`.

**Răspuns 200 – Sarcina actualizată.**

**Erori posibile:**
| Cod | Motiv |
|-----|-------|
| 403 | Sarcina aparține altui utilizator |
| 404 | Sarcina nu a fost găsită |

---

### PATCH `/api/tasks/:id/toggle`

Inversează starea `completed` a sarcinii (activ ↔ finalizat).  
Nu necesită body.

**Răspuns 200:**
```json
{ "id": "...", "completed": true, ... }
```

---

### PATCH `/api/tasks/reorder`

Actualizează ordinea sarcinilor după o operație de drag & drop.

**Body (JSON Array):**
```json
[
  { "id": "task-uuid-1", "order": 0 },
  { "id": "task-uuid-2", "order": 1 },
  { "id": "task-uuid-3", "order": 2 }
]
```

**Răspuns 200:**
```json
{ "success": true }
```

---

### DELETE `/api/tasks/:id`

Șterge definitiv o sarcină.  
Utilizatorul poate șterge **doar propriile sarcini**.

**Răspuns 200:**
```json
{ "message": "Sarcina stearsa cu succes" }
```

**Erori posibile:**
| Cod | Motiv |
|-----|-------|
| 403 | Sarcina aparține altui utilizator |
| 404 | Sarcina nu a fost găsită |

---

## 3. Health Check

### GET `/api/health`

Verifică dacă serverul rulează. Folosit de Render pentru monitorizare.

**Răspuns 200:**
```json
{ "status": "ok" }
```

---

## Coduri de eroare globale

| Cod HTTP | Semnificație |
|----------|-------------|
| 400 | Date invalide în request (validare Joi) |
| 401 | Token JWT lipsă, invalid sau expirat |
| 403 | Acces interzis (resursa aparține altui utilizator) |
| 404 | Resursa nu a fost găsită |
| 409 | Conflict (ex: email deja înregistrat) |
| 500 | Eroare internă de server |
