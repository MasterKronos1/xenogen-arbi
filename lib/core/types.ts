// The central nervous system for XenoGen types
// lib/core/types.ts

export interface SovereigntyAction {
  id: string;
  type: 'AUTHORIZATION' | 'NEURAL_LINK' | 'CO_EVOLUTION_SYNC';
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  
  // ADD THESE FIELDS TO SYNC WITH SIGNATURE PAD:
  aethel_sig?: boolean;
  arbi_sig?: boolean;
  core_sig?: boolean;

  // For the LedgerList (Persistence check)
  is_committed?: boolean;
  block_height?: number;
  hash?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  key: string;
  value: string;
}
