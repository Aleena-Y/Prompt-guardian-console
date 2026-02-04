import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  ChevronRight,
  X,
  Clock,
  Filter,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import indexedDBService, { type StoredPromptLog } from '@/services/indexedDBService';
import type { RiskLevel } from '@/types/dashboard';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedLog, setSelectedLog] = useState<StoredPromptLog | null>(null);
  const [logs, setLogs] = useState<StoredPromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, safe: 0, suspicious: 0, malicious: 0 });
  const { toast } = useToast();

  useEffect(() => {
    initializeAndLoadLogs();
  }, []);

  const initializeAndLoadLogs = async () => {
    try {
      await indexedDBService.init();
      await loadLogs();
      await loadStats();
    } catch (error) {
      console.error('Failed to initialize logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prompt logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const fetchedLogs = await indexedDBService.getPromptLogs();
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await indexedDBService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await indexedDBService.deleteLog(id);
      await loadLogs();
      await loadStats();
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
      toast({
        title: 'Log Deleted',
        description: 'Prompt log has been removed',
      });
    } catch (error) {
      console.error('Failed to delete log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete log',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      await indexedDBService.clearAllLogs();
      await loadLogs();
      await loadStats();
      setSelectedLog(null);
      toast({
        title: 'All Logs Cleared',
        description: 'All prompt logs have been deleted',
      });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear logs',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = await indexedDBService.exportLogs();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Logs have been exported to JSON',
      });
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export logs',
        variant: 'destructive',
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.prompt.toLowerCase().includes(search.toLowerCase());
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

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="cyber-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="cyber-card p-4">
            <p className="text-xs text-success uppercase tracking-wider mb-1">Safe</p>
            <p className="text-2xl font-bold text-success">{stats.safe}</p>
          </div>
          <div className="cyber-card p-4">
            <p className="text-xs text-warning uppercase tracking-wider mb-1">Suspicious</p>
            <p className="text-2xl font-bold text-warning">{stats.suspicious}</p>
          </div>
          <div className="cyber-card p-4">
            <p className="text-xs text-destructive uppercase tracking-wider mb-1">Malicious</p>
            <p className="text-2xl font-bold text-destructive">{stats.malicious}</p>
          </div>
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

          <Button
            onClick={loadLogs}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={logs.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>

        {/* Table */}
        <div className="cyber-card flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading logs...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">No logs found</p>
                <p className="text-xs text-muted-foreground">
                  {search || filter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Analyze prompts to see logs here'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto cyber-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Timestamp</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Prompt</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Risk Level</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Action</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Confidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Method</th>
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
                            {log.prompt}
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
                            actionColors[log.defenseAction]
                          )}>
                            {log.defenseAction}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-mono text-foreground">{log.confidence}%</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded uppercase font-medium",
                            log.analysisMethod === 'ollama' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {log.analysisMethod}
                          </span>
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
          )}
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
                {selectedLog.prompt}
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
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-medium", riskConfig[selectedLog.riskLevel].color)}>
                    {riskConfig[selectedLog.riskLevel].label}
                  </span>
                  <span className={cn("text-lg font-mono font-bold", riskConfig[selectedLog.riskLevel].color)}>
                    {selectedLog.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Defense Action */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Defense Action</p>
              <p className={cn("text-sm font-medium capitalize", actionColors[selectedLog.defenseAction])}>
                {selectedLog.defenseAction}
              </p>
            </div>

            {/* Reasoning */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Analysis Reasoning</p>
              <p className="text-sm text-foreground leading-relaxed">
                {selectedLog.reasoning}
              </p>
            </div>

            {/* Detected Patterns */}
            {selectedLog.detectedPatterns.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Detected Patterns</p>
                <div className="space-y-2">
                  {selectedLog.detectedPatterns.map((pattern, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-sm font-medium text-foreground">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suspicious Phrases */}
            {selectedLog.suspiciousPhrases.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Suspicious Phrases</p>
                <div className="space-y-2">
                  {selectedLog.suspiciousPhrases.map((phrase, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-sm font-mono text-destructive mb-1">{phrase.text}</p>
                      <p className="text-xs text-muted-foreground">{phrase.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sanitized Prompt */}
            {selectedLog.sanitizedPrompt && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sanitized Prompt</p>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm font-mono text-foreground">
                  {selectedLog.sanitizedPrompt}
                </div>
              </div>
            )}

            {/* Analysis Method */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Analysis Method</p>
              <span className={cn(
                "text-sm px-2 py-1 rounded uppercase font-medium",
                selectedLog.analysisMethod === 'ollama' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {selectedLog.analysisMethod}
              </span>
            </div>

            {/* Delete Button */}
            <Button
              onClick={() => selectedLog.id && handleDeleteLog(selectedLog.id)}
              variant="destructive"
              size="sm"
              className="w-full gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Log
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


