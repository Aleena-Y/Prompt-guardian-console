import { useState } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  ChevronRight,
  X,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPromptLogs } from '@/data/mockData';
import type { PromptLogEntry, RiskLevel } from '@/types/dashboard';
import { format } from 'date-fns';

const riskConfig = {
  safe: { icon: ShieldCheck, label: 'Safe', color: 'text-success', bg: 'bg-success/10' },
  suspicious: { icon: ShieldAlert, label: 'Suspicious', color: 'text-warning', bg: 'bg-warning/10' },
  malicious: { icon: ShieldX, label: 'Malicious', color: 'text-destructive', bg: 'bg-destructive/10' }
};

const actionColors = {
  allowed: 'text-success',
  sanitized: 'text-warning',
  blocked: 'text-destructive'
};

export function PromptLogs() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<PromptLogEntry | null>(null);

  const filteredLogs = mockPromptLogs.filter(log => {
    const matchesSearch = log.promptSnippet.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || log.riskLevel === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full animate-fade-in flex">
      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col", selectedLog && "mr-96")}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Prompt Logs</h1>
          <p className="text-muted-foreground">Historical record of analyzed prompts and actions taken</p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="pl-10 bg-background border-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['all', 'safe', 'suspicious', 'malicious'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  filter === level
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {level === 'all' ? 'All' : riskConfig[level].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="cyber-card flex-1 overflow-hidden">
          <div className="overflow-x-auto cyber-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Timestamp</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Prompt</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Risk Level</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Action</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Confidence</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const risk = riskConfig[log.riskLevel];
                  const RiskIcon = risk.icon;
                  
                  return (
                    <tr 
                      key={log.id}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                        selectedLog?.id === log.id && "bg-primary/5"
                      )}
                      onClick={() => setSelectedLog(log)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{format(log.timestamp, 'HH:mm:ss')}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(log.timestamp, 'MMM d, yyyy')}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground truncate max-w-md font-mono">
                          {log.promptSnippet}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                          risk.bg,
                          risk.color
                        )}>
                          <RiskIcon className="w-3 h-3" />
                          {risk.label}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-sm font-medium capitalize",
                          actionColors[log.action]
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-foreground">{log.confidence}%</span>
                      </td>
                      <td className="p-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedLog && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border overflow-y-auto cyber-scrollbar animate-slide-in-right z-50">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Timestamp */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timestamp</p>
              <p className="text-sm font-mono text-foreground">
                {format(selectedLog.timestamp, 'PPpp')}
              </p>
            </div>

            {/* Full Prompt */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Full Prompt</p>
              <div className="p-3 rounded-lg bg-background border border-border text-sm font-mono text-foreground">
                {selectedLog.fullPrompt}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Risk Assessment</p>
              <div className={cn(
                "p-4 rounded-lg border",
                riskConfig[selectedLog.riskLevel].bg,
                selectedLog.riskLevel === 'safe' && 'border-success/30',
                selectedLog.riskLevel === 'suspicious' && 'border-warning/30',
                selectedLog.riskLevel === 'malicious' && 'border-destructive/30'
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn("font-medium", riskConfig[selectedLog.riskLevel].color)}>
                    {riskConfig[selectedLog.riskLevel].label}
                  </span>
                  <span className="text-lg font-bold font-mono">{selectedLog.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Detected Patterns */}
            {selectedLog.analysisResult.detectedPatterns.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Detected Patterns</p>
                <div className="space-y-2">
                  {selectedLog.analysisResult.detectedPatterns.map((pattern) => (
                    <div 
                      key={pattern.id}
                      className="p-3 rounded-lg bg-background border border-border"
                    >
                      <p className="text-sm font-medium text-foreground">{pattern.name}</p>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Analysis Reasoning</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedLog.analysisResult.reasoning}
              </p>
            </div>

            {/* Action Taken */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Action Taken</p>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium capitalize",
                selectedLog.action === 'allowed' && 'bg-success/10 text-success',
                selectedLog.action === 'sanitized' && 'bg-warning/10 text-warning',
                selectedLog.action === 'blocked' && 'bg-destructive/10 text-destructive'
              )}>
                {selectedLog.action}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
