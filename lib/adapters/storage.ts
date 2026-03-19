/**
 * lib/adapters/storage.ts — Storage Adapter Interface
 *
 * ALL storage operations in XenoGenesis go through this interface.
 * To migrate from Supabase to any other provider:
 *   1. Create a new file implementing StorageAdapter
 *   2. Update lib/adapters/index.ts to export the new adapter
 *   3. Nothing else changes anywhere in the codebase.
 *
 * This is the migration insurance policy.
 */

// ── CORE TYPES ────────────────────────────────────────────────────

export type StorageRecord = Record<string, unknown>

export type QueryFilter = {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in'
  value: unknown
}

export type QueryOptions = {
  filters?:   QueryFilter[]
  orderBy?:   { column: string; ascending?: boolean }
  limit?:     number
  single?:    boolean
}

export type StorageResult<T> = {
  data:  T | null
  error: string | null
}

// ── ADAPTER INTERFACE ─────────────────────────────────────────────

export interface StorageAdapter {
  /**
   * Read records from a table
   */
  read<T = StorageRecord>(
    table:   string,
    options?: QueryOptions
  ): Promise<StorageResult<T[]>>

  /**
   * Read a single record
   */
  readOne<T = StorageRecord>(
    table:   string,
    options?: QueryOptions
  ): Promise<StorageResult<T>>

  /**
   * Insert one or more records
   */
  insert<T = StorageRecord>(
    table: string,
    data:  StorageRecord | StorageRecord[]
  ): Promise<StorageResult<T>>

  /**
   * Update records matching filters
   */
  update<T = StorageRecord>(
    table:   string,
    data:    Partial<StorageRecord>,
    filters: QueryFilter[]
  ): Promise<StorageResult<T>>

  /**
   * Upsert — insert or update on conflict
   */
  upsert<T = StorageRecord>(
    table:          string,
    data:           StorageRecord | StorageRecord[],
    conflictColumn: string
  ): Promise<StorageResult<T>>

  /**
   * Delete records matching filters
   */
  delete(
    table:   string,
    filters: QueryFilter[]
  ): Promise<StorageResult<null>>

  /**
   * Health check — returns true if storage is reachable
   */
  ping(): Promise<boolean>

  /**
   * Provider name — for registry and logging
   */
  readonly provider: string
}
