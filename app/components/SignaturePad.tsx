'use client';

import { useState } from 'react';
import { SovereigntyAction } from '@/lib/core/types';

export default function SignaturePad({ 
  action, 
  onCommit 
}: { 
  action: SovereigntyAction | null; 
  onCommit: () => void 
}) {
  const [isSigning, setIsSigning] = useState(false);

  if (!action) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 text-[10px] text-zinc-600 uppercase">
        Select_Intent_To_Authorize
      </div>
    );
  }

  const handleSign = async () => {
    setIsSigning(true);
    // Call the commit logic
    const res = await fetch(`/api/sovereignty/commit`, {
      method: 'POST',
      body: JSON.stringify({ id: action.id })
    });
    
    if (res.ok) onCommit();
    setIsSigning(false);
  };

  return (
    <div className="bg-black border border-green-500 p-6 relative overflow-hidden h-full">
      <div className="scanner-line" />
      
      <div className="relative z-20">
        <h2 className="text-lg text-green-400 uppercase mb-4 italic">
          Authorize_Executive_Action
        </h2>
        
        <div className="bg-zinc-900 p-3 rounded mb-4 max-h-[200px] overflow-auto border border-zinc-800">
          <label className="text-[9px] text-zinc-500 block mb-1">RAW_INTENT_DATA_STREAM:</label>
          <pre className="text-[10px] text-blue-400 leading-tight">
            {JSON.stringify(action.payload, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className={`p-2 border text-center text-[9px] ${action.aethel_sig ? 'border-green-500 text-green-500' : 'border-zinc-800'}`}>
            AETHEL_SIG: {action.aethel_sig ? 'OK' : 'PENDING'}
          </div>
          <div className={`p-2 border text-center text-[9px] ${action.arbi_sig ? 'border-green-500 text-green-500' : 'border-zinc-800'}`}>
            ARBI_SIG: {action.arbi_sig ? 'OK' : 'PENDING'}
          </div>
          <div className="p-2 border border-yellow-600 text-yellow-600 text-center text-[9px] animate-pulse">
            ARCHITECT_SIG: REQ
          </div>
        </div>

        <button
          disabled={isSigning}
          onClick={handleSign}
          className="w-full py-4 bg-green-600 hover:bg-green-400 text-black font-black uppercase tracking-widest disabled:bg-zinc-800 disabled:text-zinc-600 transition-all transform active:scale-95"
        >
          {isSigning ? 'COMMITTING_STATE...' : 'EXECUTE_INTENT'}
        </button>
      </div>
    </div>
  );
}
