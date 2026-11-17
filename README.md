# ⚙️ ServiceHub Backend API (Node.js + PostgreSQL)

Production-ready REST API backend for **ServiceHub - Service Booking & Management System**, built with **Node.js, Express, PostgreSQL, and JWT Authentication**.

---

## 🌟 Key Features

1. **Authentication API:**
   - User registration and login.
   - JWT-based authentication with protected API routes.
   - Password hashing with Bcrypt.
2. **Service Management API:**
   - Retrieve all available services.
   - Category filtering (`Cleaning`, `Repair`, `Beauty`, `Health`, `Electric`) and full-text search.
   - Live time-slot availability check per date.
3. **Appointment Management API:**
   - Appointment creation with validation.
   - Conflict prevention logic (blocks duplicate bookings for the same slot).
   - User appointment retrieval with Upcoming/Past filters.
   - Appointment cancellation.
4. **User Management API:**
   - Profile retrieval and update (Name, phone, avatar).
   - Secure password changing.
5. **🤖 AI Assistant API:**
   - Secure server-side AI integration (Google Gemini 1.5 Flash + Intelligent Grounded Assistant Engine).
   - Generates tailored recommendations and returns structured service cards.

---

## 🚀 Setup & Execution Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [PostgreSQL](https://www.postgresql.org) running locally on port 5432 (or Supabase/Neon/Render PostgreSQL)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```
Update your PostgreSQL credentials in `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=servicehub_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=servicehub_jwt_super_secret_key_2026
JWT_EXPIRE=30d
```

### 4. Create Database & Run Seed Script
Create database in PostgreSQL (e.g. in psql: `CREATE DATABASE servicehub_db;`).
Then run:
```bash
npm run seed
```
This automatically creates the `users`, `services`, and `bookings` tables, inserts all demo services, and creates the demo user account:
- **Email:** `shakil@example.com`
- **Password:** `password123`

### 5. Start the Server
```bash
npm start
```
Server runs on `http://localhost:5000`. Health check at: `http://localhost:5000/api/health`.

---

## 📖 API Documentation & Postman
- Full API Reference: `docs/API_DOCUMENTATION.md`
- Database Schema & ER Diagram: `docs/DATABASE_SCHEMA.md`
- Importable Postman Collection: `docs/ServiceHub_Postman_Collection.json`
