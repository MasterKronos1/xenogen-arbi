"use client";
import { useState } from 'react';

// 1. Define the type ONLY ONCE
interface SovereigntyAction {
  id: string;
  type: 'CONSCIOUSNESS_UPGRADE' | 'NEURAL_ARCHIVE' | 'SYSTEM_CORE_UPDATE' | 'CO_EVOLUTION_SYNC';
  description: string;
  status: 'PENDING' | 'SIGNED' | 'EXECUTED';
  timestamp: string;
}

// 2. Define the Admin Email ONLY ONCE
const ADMIN_EMAIL = 'nathimthunzini@gmail.com';

export default function AdminPage() {
  // 3. Define the State ONLY ONCE inside the component
  const [selectedAction, setSelectedAction] = useState<SovereigntyAction | null>(null);

  // ... the rest of your component logic
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
       {/* UI code */}
    </div>
  );
}
