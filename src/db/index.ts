import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const DEFAULT_SUPABASE_POOLER =
  "postgresql://postgres.bohgzryjrloywzxxkrlf:Aster%401145%2F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

let databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  DEFAULT_SUPABASE_POOLER;

// If set to direct IPv6 host (which times out on serverless / non-IPv6 networks), rewrite to reliable IPv4 pooler
if (databaseUrl.includes("db.bohgzryjrloywzxxkrlf.supabase.co:5432")) {
  databaseUrl = DEFAULT_SUPABASE_POOLER;
}

// If using session mode pooler (port 5432), rewrite to transaction mode (port 6543) to support unlimited serverless clients
if (databaseUrl.includes(".pooler.supabase.com:5432")) {
  databaseUrl = databaseUrl.replace(".pooler.supabase.com:5432", ".pooler.supabase.com:6543");
}

const isSupabase =
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("pooler.supabase.com") ||
  databaseUrl.includes("sslmode=require");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
