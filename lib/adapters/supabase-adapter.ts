/**
 * lib/adapters/supabase-adapter.ts — Supabase Storage Adapter
 *
 * Concrete implementation of StorageAdapter using Supabase.
 * This is the ONLY file that knows about Supabase.
 * Everything else uses StorageAdapter interface only.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { StorageAdapter, StorageRecord, QueryOptions, QueryFilter, StorageResult } from './storage'

export class SupabaseStorageAdapter implements StorageAdapter {
  readonly provider = 'supabase'
  private client: SupabaseClient

  constructor(url: string, key: string) {
    this.client = createClient(url, key)
  }

  // ── QUERY BUILDER ───────────────────────────────────────────────

  private buildQuery(table: string, options?: QueryOptions) {
    let query = this.client.from(table).select('*')

    if (options?.filters) {
      for (const f of options.filters) {
        switch (f.operator) {
          case 'eq':  query = (query as any).eq(f.column, f.value);  break
          case 'neq': query = (query as any).neq(f.column, f.value); break
          case 'gt':  query = (query as any).gt(f.column, f.value);  break
          case 'lt':  query = (query as any).lt(f.column, f.value);  break
          case 'gte': query = (query as any).gte(f.column, f.value); break
          case 'lte': query = (query as any).lte(f.column, f.value); break
          case 'in':  query = (query as any).in(f.column, f.value);  break
        }
      }
    }

    if (options?.orderBy) {
      query = (query as any).order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      })
    }

    if (options?.limit) {
      query = (query as any).limit(options.limit)
    }

    return query
  }

  // ── READ ────────────────────────────────────────────────────────

  async read<T = StorageRecord>(
    table: string,
    options?: QueryOptions
  ): Promise<StorageResult<T[]>> {
    try {
      const { data, error } = await this.buildQuery(table, options)
      return { data: (data as T[]) ?? [], error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  async readOne<T = StorageRecord>(
    table: string,
    options?: QueryOptions
  ): Promise<StorageResult<T>> {
    try {
      const { data, error } = await this.buildQuery(table, options).single()
      return { data: data as T ?? null, error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  // ── INSERT ──────────────────────────────────────────────────────

  async insert<T = StorageRecord>(
    table: string,
    data: StorageRecord | StorageRecord[]
  ): Promise<StorageResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data as any)
        .select()
      return { data: result as T ?? null, error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  // ── UPDATE ──────────────────────────────────────────────────────

  async update<T = StorageRecord>(
    table: string,
    data: Partial<StorageRecord>,
    filters: QueryFilter[]
  ): Promise<StorageResult<T>> {
    try {
      let query = this.client.from(table).update(data as any)
      for (const f of filters) {
        if (f.operator === 'eq') query = (query as any).eq(f.column, f.value)
      }
      const { data: result, error } = await (query as any).select()
      return { data: result as T ?? null, error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  // ── UPSERT ──────────────────────────────────────────────────────

  async upsert<T = StorageRecord>(
    table: string,
    data: StorageRecord | StorageRecord[],
    conflictColumn: string
  ): Promise<StorageResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .upsert(data as any, { onConflict: conflictColumn })
        .select()
      return { data: result as T ?? null, error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  // ── DELETE ──────────────────────────────────────────────────────

  async delete(
    table: string,
    filters: QueryFilter[]
  ): Promise<StorageResult<null>> {
    try {
      let query = this.client.from(table).delete()
      for (const f of filters) {
        if (f.operator === 'eq') query = (query as any).eq(f.column, f.value)
      }
      const { error } = await query
      return { data: null, error: error?.message ?? null }
    } catch (e) {
      return { data: null, error: String(e) }
    }
  }

  // ── PING ────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const { error } = await this.client.from('users').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }
}

// ── SINGLETON FACTORY ─────────────────────────────────────────────
// Import this everywhere instead of creating new clients directly

let _adapter: SupabaseStorageAdapter | null = null

export function getStorageAdapter(): SupabaseStorageAdapter {
  if (!_adapter) {
    _adapter = new SupabaseStorageAdapter(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _adapter
}
