// lib/adapters/storage-adapter.ts
import { getSupabase } from '@/lib/supabase'

export interface StorageAdapter {
  get: (table: string, query: Record<string, any>) => Promise<any>
  set: (table: string, data: Record<string, any>) => Promise<any>
  delete: (table: string, query: Record<string, any>) => Promise<any>
}

export function createSupabaseAdapter(): StorageAdapter {
  const db = getSupabase()
  return {
    get: async (table, query) => {
      const { data, error } = await db.from(table).select('*').match(query)
      if (error) throw error
      return data
    },
    set: async (table, data) => {
      const { data: result, error } = await db.from(table).upsert(data).select()
      if (error) throw error
      return result
    },
    delete: async (table, query) => {
      const { error } = await db.from(table).delete().match(query)
      if (error) throw error
    }
  }
}
