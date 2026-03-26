import { SovereigntyAction, UserProfile, Memory } from '../core/types';

export interface IStorageProvider {
  // User & Memory
  getUser(id: string): Promise<UserProfile | null>;
  saveMemory(userId: string, key: string, value: string): Promise<void>;
  
  // Sovereignty Ledger
  getPendingActions(): Promise<SovereigntyAction[]>;
  proposeAction(action: Omit<SovereigntyAction, 'id' | 'is_committed'>): Promise<string>;
  commitAction(actionId: string, architectSig: boolean): Promise<boolean>;
}
