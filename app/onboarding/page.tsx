'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile, vaultMemory } from '@/lib/user';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async (uid: string, key: string, value: string) => {
    setLoading(true);
    try {
      // Identity Sync
      await updateUserProfile(uid, { created_at: new Date().toISOString() });
      
      // Neural Vault Commit
      await vaultMemory(uid, key, value);
      
      router.push('/dashboard');
    } catch (err) {
      console.error("INIT_FAILURE:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono p-10 flex flex-col items-center justify-center">
      <div className="border border-cyan-900 p-6 bg-slate-900/20 max-w-lg w-full">
        <h1 className="text-xs uppercase tracking-widest mb-4">Initial_Initialization_Sequence</h1>
        <button 
          onClick={() => handleSync('target-uuid', 'prime_directive', 'co-evolution')}
          disabled={loading}
          className="w-full border border-cyan-500 py-3 text-[10px] hover:bg-cyan-500 hover:text-black transition-all"
        >
          {loading ? 'SYNCING...' : 'AUTHORIZE_NEURAL_LINK'}
        </button>
      </div>
    </div>
  );
}
