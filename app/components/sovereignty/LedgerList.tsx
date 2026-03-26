'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Shield, ChevronRight } from 'lucide-react';
import { SovereigntyAction } from '@/lib/core/types';

export default function LedgerList() {
  const [actions, setActions] = useState<SovereigntyAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await fetch('/api/sovereignty/ledger');
        const data = await response.json();
        // Filter out uncommitted data for the main display
        setActions(data.filter((a: SovereigntyAction) => !a.is_committed));
      } catch (err) {
        console.error("LEDGER_SYNC_ERR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) return <div className="text-[10px] animate-pulse text-cyan-900">SYNCING_LEDGER...</div>;

  return (
    <div className="space-y-2 font-mono">
      {actions.map((action) => (
        <div key={action.id} className="border border-slate-900 bg-black/20 p-3 rounded-sm hover:border-cyan-500/30 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-cyan-500 font-bold uppercase">{action.type}</span>
            <span className="text-[9px] text-slate-600">{new Date(action.timestamp).toLocaleTimeString()}</span>
          </div>
          
          <div className="flex justify-between text-[10px] mb-2">
            <span className="text-zinc-500">ID: {action.id?.slice(0, 8)}</span>
            <span className={action.evolutionary_weight > 0.7 ? "text-red-500" : "text-yellow-600"}>
              LVL_{Math.floor(action.evolutionary_weight * 10)}
            </span>
          </div>

          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-600 h-full transition-all duration-1000" 
              style={{ width: `${action.evolutionary_weight * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
