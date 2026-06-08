# Repositories Layer (Database Queries)

This folder contains all repository classes. Repositories handle database operations (CRUD queries) using the PostgreSQL connection pool.

## Deliverables for Interns:

1. **Repositories (`*.repository.ts`)**:
   - Create class-based repositories for querying your database tables.
   - Import the shared DB connection pool from `src/config/database`.
   - Keep SQL queries parameterized to protect against SQL injections.
   - Example files:
     - `user.repository.ts`
     - `product.repository.ts`
     - `order.repository.ts`

### Example Repository Pattern:
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
