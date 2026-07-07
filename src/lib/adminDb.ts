// adminDb.ts — drop-in replacement for direct supabase.from() calls in admin
// pages. Routes everything through the admin-db Edge Function, which verifies
// the admin session server-side before touching the database.

import { ADMIN_API } from '../contexts/AdminAuthContext';

// ADMIN_API targets the admin-auth function; admin-db is its sibling function.
const ADMIN_DB_API = ADMIN_API.replace(/\/admin-auth$/, '/admin-db');

type Action = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

interface QueryOpts {
  columns?: string;
  match?: Record<string, unknown>;
  values?: Record<string, unknown> | Record<string, unknown>[];
  order?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[];
  limit?: number;
  count?: 'exact';
  head?: boolean;
  in?: Record<string, unknown[]>;
  notIn?: Record<string, unknown[]>;
  single?: boolean;
  returning?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DbResponse<T = any> {
  data: T;
  count?: number;
  error?: string;
}

async function call<T>(
  sessionToken: string,
  action: Action | 'list-users',
  opts: Record<string, unknown> = {},
): Promise<DbResponse<T>> {
  const res = await fetch(ADMIN_DB_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ session_token: sessionToken, action, ...opts }),
  });
  return res.json() as Promise<DbResponse<T>>;
}

type SelectOpts = Omit<QueryOpts, 'columns' | 'values' | 'returning'>;
type WriteOpts = { single?: boolean; returning?: string };
type UpsertOpts = WriteOpts & { onConflict?: string; ignoreDuplicates?: boolean };

export function adminDb(sessionToken: string, table: string) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: <T = any>(columns = '*', opts: SelectOpts = {}) =>
      call<T>(sessionToken, 'select', { table, columns, ...opts }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insert: <T = any>(values: QueryOpts['values'], opts: WriteOpts = {}) =>
      call<T>(sessionToken, 'insert', { table, values, ...opts }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: <T = any>(values: QueryOpts['values'], match: QueryOpts['match'], opts: WriteOpts = {}) =>
      call<T>(sessionToken, 'update', { table, values, match, ...opts }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert: <T = any>(values: QueryOpts['values'], opts: UpsertOpts = {}) =>
      call<T>(sessionToken, 'upsert', { table, values, ...opts }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: <T = any>(match: QueryOpts['match']) =>
      call<T>(sessionToken, 'delete', { table, match }),
  };
}

// Auth Admin API proxy (supabase.auth.admin.listUsers) — not a table query,
// so it's a standalone action rather than a method on adminDb().
export function adminAuthListUsers(
  sessionToken: string,
  opts: { page?: number; perPage?: number } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<DbResponse<{ users: any[] }>> {
  return call(sessionToken, 'list-users', opts);
}
