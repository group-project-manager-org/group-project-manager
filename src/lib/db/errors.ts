/** Thrown by every src/lib/db function on failure. `code` is the Postgres/PostgREST code or an app code like 'FILE_TOO_LARGE'. */
export class DbError extends Error {
  code: string;

  constructor(message: string, code = 'UNKNOWN') {
    super(message);
    this.name = 'DbError';
    this.code = code;
  }
}

/** Wraps a Supabase error ({ message, code }) in a DbError. */
export function toDbError(err: { message: string; code?: string }): DbError {
  return new DbError(err.message, err.code ?? 'UNKNOWN');
}

/** Placeholder body for contract stubs that are not implemented yet. */
export function notImplemented(fn: string): never {
  throw new DbError(`${fn} is not implemented yet`, 'NOT_IMPLEMENTED');
}
