import { SovereigntyAction, UserProfile } from '../core/types'

export type StorageRecord = Record<string, unknown>

export type QueryOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in'

export interface QueryFilter {
  column: string
  operator: QueryOperator
  value: any
}

export interface QueryOptions {
  filters?: QueryFilter[]
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
}

export interface StorageResult<T> {
  data: T | null
  error: string | null
}

export interface StorageAdapter {
  provider: string
  read<T = StorageRecord>(table: string, options?: QueryOptions): Promise<StorageResult<T[]>>
  readOne<T = StorageRecord>(table: string, options?: QueryOptions): Promise<StorageResult<T>>
  insert<T = StorageRecord>(table: string, data: StorageRecord | StorageRecord[]): Promise<StorageResult<T>>
  update<T = StorageRecord>(table: string, data: Partial<StorageRecord>, filters: QueryFilter[]): Promise<StorageResult<T>>
  upsert<T = StorageRecord>(table: string, data: StorageRecord | StorageRecord[], conflictColumn: string): Promise<StorageResult<T>>
  delete(table: string, filters: QueryFilter[]): Promise<StorageResult<null>>
  ping(): Promise<boolean>
}

// Legacy interface kept for compatibility with older code
export interface IStorageProvider {
  getUser(id: string): Promise<UserProfile | null>
  saveMemory(userId: string, key: string, value: string): Promise<void>
  getPendingActions(): Promise<SovereigntyAction[]>
  proposeAction(action: Omit<SovereigntyAction, 'id' | 'is_committed'>): Promise<string>
  commitAction(actionId: string, architectSig: boolean): Promise<boolean>
}
