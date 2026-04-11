import { SovereigntyAction, UserProfile, Memory } from '../core/types'

export interface IStorageProvider {
  getUser(id: string): Promise<UserProfile | null>
  saveMemory(userId: string, key: string, value: string): Promise<void>
  getPendingActions(): Promise<SovereigntyAction[]>
  proposeAction(action: Omit<SovereigntyAction, 'id' | 'is_committed'>): Promise<string>
  commitAction(actionId: string, architectSig: boolean): Promise<boolean>
}

export type StorageRecord = Record<string, any>

export type StorageResult<T> = {
  data: T | null
  error: string | null
}

export type QueryFilter = {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in'
  value: any
}

export type QueryOptions = {
  filters?: QueryFilter[]
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
}

export interface StorageAdapter {
  readonly provider: string
  read<T = StorageRecord>(table: string, options?: QueryOptions): Promise<StorageResult<T[]>>
  readOne<T = StorageRecord>(table: string, options?: QueryOptions): Promise<StorageResult<T>>
  insert<T = StorageRecord>(table: string, data: StorageRecord | StorageRecord[]): Promise<StorageResult<T>>
  update<T = StorageRecord>(table: string, data: Partial<StorageRecord>, filters: QueryFilter[]): Promise<StorageResult<T>>
  upsert<T = StorageRecord>(table: string, data: StorageRecord | StorageRecord[], conflictColumn: string): Promise<StorageResult<T>>
  delete(table: string, filters: QueryFilter[]): Promise<StorageResult<null>>
  ping(): Promise<boolean>
}
