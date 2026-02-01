import { Shield, Activity, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DefenseMode } from '@/types/dashboard';

interface TopBarProps {
  defenseMode: DefenseMode;
  onDefenseModeChange: (mode: DefenseMode) => void;
  modelName?: string;
}

export function TopBar({ 
  defenseMode, 
  onDefenseModeChange, 
  modelName = 'GPT-4 Turbo' 
}: TopBarProps) {
  const isStrict = defenseMode === 'strict';

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Status */}
      <div className="flex items-center gap-6">
        {/* System Status */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-success pulse-safe" />
          </div>
          <span className="text-sm font-medium text-foreground">System Active</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/30">
            Protected
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* AI Model */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Model:</span>
          <span className="text-sm font-medium text-foreground font-mono">{modelName}</span>
        </div>
      </div>

      {/* Right: Defense Mode Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Defense Mode:</span>
          
          <button
            onClick={() => onDefenseModeChange(isStrict ? 'adaptive' : 'strict')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
              isStrict 
                ? "bg-warning/10 border-warning/30 text-warning"
                : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            {isStrict ? (
              <>
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Strict</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Adaptive</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono">LIVE</span>
        </div>
      </div>
    </header>
  );
}
