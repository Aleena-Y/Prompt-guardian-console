import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { DefenseMode } from '@/types/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [defenseMode, setDefenseMode] = useState<DefenseMode>('adaptive');

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          defenseMode={defenseMode}
          onDefenseModeChange={setDefenseMode}
        />
        
        <main className="flex-1 overflow-auto p-6 cyber-scrollbar cyber-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
