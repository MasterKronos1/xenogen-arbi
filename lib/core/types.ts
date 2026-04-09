/**
 * XENOGEN_CORE_TYPES: The blueprint for the entire ecosystem.
 */
export interface SovereigntyAction {
  id: string;
  type: 'AUTHORIZATION' | 'NEURAL_LINK' | 'CO_EVOLUTION_SYNC' | 'LEDGER_ENTRY';
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  aethel_sig?: boolean;
  arbi_sig?: boolean;
  core_sig?: boolean;
  is_committed: boolean;
  evolutionary_weight: number;
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
  embedding?: number[];
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  mode?: string;
  created_at: string;
  updated_at?: string;
}
