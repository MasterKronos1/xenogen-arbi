'use client';

import React, { useEffect, useState } from 'react';
import { 
  Compass, LogOut, Brain, X, Paperclip, FileText, 
  Terminal, Shield, Activity, Cpu 
} from 'lucide-react';
import { 
  getUserConversations, getUserMemory, getOrCreateUser,
  resolvePathway, getPathwayProgress,
  type UserProfile, type Memory, type Conversation 
} from '@/lib/user';
import { signOut } from '@/lib/auth'; // Ensure your auth lib is stable

export default function EngineersDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSystem() {
      try {
        // Replace with your actual session logic
        const activeUser = await getOrCreateUser('admin@xenogen.arbi'); 
        setUser(activeUser);
        
        const [memData, convData] = await Promise.all([
          getUserMemory(activeUser.id),
          getUserConversations(activeUser.id)
        ]);
        
        setMemories(memData);
        setConversations(convData);
      } catch (err) {
        console.error("SYSTEM_CRITICAL_FAILURE:", err);
      } finally {
        setLoading(false);
      }
    }
    initSystem();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-black text-cyan-500 font-mono">
      <div className="animate-pulse">INITIALIZING_NEURAL_LINK...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-slate-300 font-mono p-4 selection:bg-cyan-500/30">
      {/* Header / HUD */}
      <header className="border-b border-cyan-900/50 pb-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-cyan-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-widest text-cyan-100">XENOGEN_ARBI // v1.0.0</h1>
        </div>
        <div className="flex items-center gap-6 text-xs text-cyan-700">
          <span className="flex items-center gap-2"><Activity className="w-3 h-3"/> SYNC_ACTIVE</span>
          <button onClick={() => signOut()} className="hover:text-red-400 transition-colors flex items-center gap-1">
            <LogOut className="w-3 h-3"/> DISCONNECT
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar: Neural Vault */}
        <section className="col-span-3 border border-slate-800 bg-slate-900/20 p-4 rounded-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs uppercase tracking-tighter text-slate-500">Neural_Vault</h2>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[70vh]">
            {memories.map((m) => (
              <div key={m.id} className="text-[10px] p-2 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-crosshair">
                <span className="text-cyan-600">[{m.key}]</span> {m.value}
              </div>
            ))}
          </div>
        </section>

        {/* Center: Main Command Interface */}
        <section className="col-span-6 space-y-6">
          <div className="h-[60vh] border border-cyan-900/30 bg-black/40 rounded-sm relative p-4 overflow-hidden shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
            <div className="text-xs text-cyan-400/60 mb-4 flex items-center gap-2">
              <Terminal className="w-3 h-3"/> STAGE_01_INPUT_RECOGNIZED
            </div>
            {/* Chat output would go here */}
            <div className="text-sm space-y-4">
              <p className="text-slate-500 italic">Waiting for operator directive...</p>
            </div>
          </div>

          <div className="relative">
            <textarea 
              className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-sm text-sm focus:outline-none focus:border-cyan-500/50 min-h-[100px] resize-none"
              placeholder="ENTER COMMAND..."
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Paperclip className="w-4 h-4 text-slate-600 hover:text-cyan-400 cursor-pointer" />
              <Shield className="w-4 h-4 text-slate-600 hover:text-cyan-400 cursor-pointer" />
            </div>
          </div>
        </section>

        {/* Right Sidebar: Ecosystem Status */}
        <section className="col-span-3 space-y-6">
          <div className="border border-slate-800 p-4 rounded-sm">
            <h3 className="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-500" /> ECOSYSTEM_NODES
            </h3>
            <div className="space-y-3">
              {['SUPABASE_DB', 'GROQ_INFERENCE', 'VERCEL_EDGE'].map(node => (
                <div key={node} className="flex justify-between items-center text-[10px]">
                  <span>{node}</span>
                  <span className="text-green-500">ONLINE</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-cyan-900/20 p-4 rounded-sm bg-cyan-950/5">
            <h3 className="text-xs text-cyan-400 mb-2 font-bold">CO-EVOLUTION_ALIGNMENT</h3>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full w-[78%]"></div>
            </div>
            <p className="text-[9px] mt-2 text-slate-500">Targeting Earth-Beyond Synchronization...</p>
          </div>
        </section>
      </div>
    </main>
  );
}
