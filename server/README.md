# Samaagum Backend Server - Layered Monolith

This directory contains the backend architecture for **Samaagum**, structured as a **Layered Monolith**. It is prepared with PostgreSQL integration and a complete dev environment configuration so that interns can design their database schemas and repository layers.

---

## 🏗️ Architecture Overview

A **Layered Monolith** separates concerns horizontally:
1. **Controllers Layer (`src/controllers/`)**: Handles incoming HTTP requests and structures HTTP responses.
2. **Services Layer (`src/services/`)**: Implements business rules and orchestrates domain functionality.
3. **Repositories Layer (`src/repositories/`)**: Houses Repository classes to perform database queries.
4. **Database Layer (`src/db/`)**: Contains raw database DDL schema definitions (SQL tables and indexes).

```
src/
├── config/
│   └── database.ts            # Shared PostgreSQL connection pool
├── db/                        # SQL schemas & table definitions (All domains)
├── repositories/              # Repository query classes (All domains)
├── services/                  # Business logic services (All domains)
├── controllers/               # HTTP route controllers (All domains)
└── index.ts                   # Application entrypoint
```

---

## 🚀 Environment Setup

### 1. Database (PostgreSQL)
The application expects PostgreSQL to be running locally on your machine.
- Host: `localhost`
- Port: `5432`
- Database: `samaagum`
- User: `shree` (or your local system username)
- Password: (blank)

The database `samaagum` is already created on the host machine.

### 2. Environment Variables (`.env`)
Create/configure the DB connection in `.env` within this `server` directory. By default, it points to the local Postgres setup:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=shree
DB_PASSWORD=
DB_NAME=samaagum
DATABASE_URL=postgresql://shree@localhost:5432/samaagum
```

---

## 🛠️ How to Run

1. **Change Directory to Server**:
   ```bash
   cd server
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Migrate Database**:
   ```bash
   npm run migrate
   ```

4. **Import GeoLite Data**:
   ```bash
   npm run import-geolite
   ```

5. **Start the Development Server (with Live Reload)**:
   ```bash
   npm run dev
   ```

4. **Verify Connection**:
   Once the server starts, open your browser or API client (Postman/Curl) and hit:
   `GET http://localhost:3000/health`
   You should receive an `OK` status with the current database time.

---

## 📝 Internship Guide: Designing Schemas & Repositories

### 1. Design the Table Schema (`src/db/*.sql`)
Write the table structure under `src/db/`. Ensure you use primary keys, proper data types, indices for query speed, and foreign keys for referential integrity.

*Example user schema definition (`src/db/users.sql`):*
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Implement the Repository Class (`src/repositories/*.repository.ts`)
Create a repository file (e.g., `src/repositories/user.repository.ts`) that handles database queries utilizing the connection pool.

*Example repository setup:*
```typescript
import pool from '../config/database';

export class UserRepository {
  async createUser(name: string, email: string, passwordHash: string) {
    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const values = [name, email, passwordHash];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async findUserByEmail(email: string) {
    const query = `SELECT * FROM users WHERE email = $1;`;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }
}
```

### 3. Implement the Service Layer (`src/services/*.service.ts`)
Create service classes that import the repositories to perform business logic.

*Example service setup:*
```typescript
import { UserRepository } from '../repositories/user.repository';

const userRepository = new UserRepository();

export class UserService {
  async registerUser(name: string, email: string, passwordHash: string) {
    const existing = await userRepository.findUserByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }
    return await userRepository.createUser(name, email, passwordHash);
  }
}
```
