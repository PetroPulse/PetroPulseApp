// lib/db.ts
import { Pool } from "pg";

// Final belt-and-suspenders fix:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is not set in .env.local");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false, // ← THIS fixes the self-signed cert issue
  },
});
