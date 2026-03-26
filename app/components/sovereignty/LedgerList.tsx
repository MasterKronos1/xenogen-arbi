'use client';

import { useEffect, useState } from 'react';
import { SovereigntyAction } from '@/lib/core/types';

export default function LedgerList({ onSelect }: { onSelect: (action: SovereigntyAction) => void }) {
  const [actions, setActions] = useState<SovereigntyAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the "Pulse" — keeping the dashboard synced with the DB
    const fetchLedger = async () => {
      const response = await fetch('/api/sovereignty/ledger');
      const data = await response.json();
      setActions(data.filter((a: SovereigntyAction) => !a.is_committed));
      setLoading(false);
    };

    fetchLedger();
    const interval = setInterval(fetchLedger, 5000); // 5s Heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="crt-monitor p-4 border border-green-900 rounded bg-zinc-950 font-mono">
      <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
        <h3 className="text-xs uppercase tracking-tighter text-green-400">
          [ PENDING_INTENTS_SCAN ]
        </h3>
        <span className="text-[10px] text-green-800 animate-pulse">LIVE_SYNC_ACTIVE</span>
      </div>

      {loading ? (
        <div className="text-[10px] text-zinc-500">INITIALIZING_SCANNER...</div>
      ) : actions.length === 0 ? (
        <div className="text-[10px] text-zinc-700">NO_UNAUTHORIZED_INTENTS_DETECTED.</div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[400px]">
          {actions.map((action) => (
            <div 
              key={action.id} 
              onClick={() => onSelect(action)}
              className="group border border-zinc-800 p-2 cursor-pointer hover:border-green-500 transition-all bg-black"
            >
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">ID: {action.id?.slice(0, 8)}</span>
                <span className={action.evolutionary_weight > 0.7 ? "text-red-500" : "text-yellow-600"}>
                  LVL_{action.evolutionary_weight * 10}
                </span>
              </div>
              <div className="text-xs mt-1 truncate group-hover:text-green-400">
                {action.intent_label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
