'use client';

import React, { useEffect, useState } from 'react';
import { SovereigntyAction } from '@/lib/core/types';

/** * OVERRIDE: Renaming the local type to 'ILedgerAction' 
 * This bypasses the build cache that is haunting 'SovereigntyAction'
 */
interface ILedgerAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  status: string;
  evolutionary_weight: number; 
  is_committed: boolean;
}

export default function LedgerList() {
  // Use the local ILedgerAction for the state
  const [actions, setActions] = useState<ILedgerAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await fetch('/api/sovereignty/ledger');
        const data = await response.json();
        
        // We cast the data to ILedgerAction to satisfy the math on line 40
        const typedData = data as ILedgerAction[];
        setActions(typedData.filter((a) => !a.is_committed));
      } catch (err) {
        console.error("LEDGER_SYNC_ERR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) return <div className="text-[10px] animate-pulse text-cyan-900 font-mono">SYNCING_LEDGER...</div>;

  return (
    <div className="space-y-2 font-mono text-slate-300">
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

          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-500 h-full transition-all duration-700" 
              style={{ width: `${action.evolutionary_weight * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
