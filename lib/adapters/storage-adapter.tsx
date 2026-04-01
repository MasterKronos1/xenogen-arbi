'use client';
import { useState } from 'react';

export default function SovereigntyDashboard() {
  const [actions, setActions] = useState<any[]>([]);

  // Fetch proposed actions from the ledger
  const refreshLedger = async () => {
    // Logic to call your API/Supabase to get uncommitted actions
  };

  return (
    <div className="bg-black text-green-500 font-mono p-4 border-2 border-green-900 rounded-lg shadow-2xl">
      <h2 className="text-xl mb-4 uppercase tracking-widest border-b border-green-900 pb-2">
        Sovereignty Control Plane // Aethel-01
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {actions.length === 0 ? (
          <div className="animate-pulse text-xs">SCANNING_FOR_PENDING_INTENTS... NONE_FOUND</div>
        ) : (
          actions.map(action => (
            <div key={action.id} className="border border-green-800 p-3 bg-zinc-950">
              <div className="flex justify-between text-xs mb-2">
                <span>INTENT_HASH: {action.id.slice(0,8)}</span>
                <span className="text-yellow-500">WT: {action.evolutionary_weight}</span>
              </div>
              <p className="text-sm text-zinc-300 mb-3">{action.intent_label}</p>
              <button 
                className="w-full bg-green-900 hover:bg-green-700 text-black font-bold py-1 px-2 uppercase text-xs transition-colors"
                onClick={() => {}}
              >
                Sign & Commit [Architect_Sig]
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 text-[10px] text-zinc-600 uppercase">
        Substrate: Vercel_Free_Tier // Latency: Optimized // Status: Symbiosis_Active
      </div>
    </div>
  );
}
