// The central nervous system for XenoGen types
export interface SovereigntyAction {
  id: string;
  type: 'AUTHORIZATION' | 'NEURAL_LINK' | 'CO_EVOLUTION_SYNC';
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
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
