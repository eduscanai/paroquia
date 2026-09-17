import { Pool } from "pg";

// Em dev, o Next recarrega módulos a cada mudança — guardamos a pool no
// `global` pra não abrir uma conexão nova a cada hot reload.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}
