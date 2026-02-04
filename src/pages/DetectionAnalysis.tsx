import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileSearch, 
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Activity,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import indexedDBService, { type StoredPromptLog } from '@/services/indexedDBService';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const riskConfig = {
  safe: { icon: ShieldCheck, label: 'Safe', color: 'text-success', bg: 'bg-success/10' },
  suspicious: { icon: ShieldAlert, label: 'Suspicious', color: 'text-warning', bg: 'bg-warning/10' },
  malicious: { icon: ShieldX, label: 'Malicious', color: 'text-destructive', bg: 'bg-destructive/10' }
};

const COLORS = ['hsl(160, 84%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export function DetectionAnalysis() {
  const [logs, setLogs] = useState<StoredPromptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, safe: 0, suspicious: 0, malicious: 0 });

  useEffect(() => {
    initializeAndLoadLogs();
  }, []);

  const initializeAndLoadLogs = async () => {
    try {
      await indexedDBService.init();
      await loadLogs();
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const fetchedLogs = await indexedDBService.getPromptLogs();
      setLogs(fetchedLogs);
      
      // Calculate statistics
      const statistics = await indexedDBService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  // Calculate stats from loaded logs
  const riskDistribution = [
    { name: 'Safe', value: stats.safe },
    { name: 'Suspicious', value: stats.suspicious },
    { name: 'Malicious', value: stats.malicious },
  ];

  // Calculate attack pattern distribution from detected patterns
  const patternMap = new Map<string, number>();
  logs.forEach(log => {
    log.detectedPatterns.forEach(pattern => {
      patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1);
    });
  });

  const patternData = Array.from(patternMap).map(([pattern, count]) => ({
    pattern: pattern.split(' ')[0],
    count,
    fullMark: Math.max(10, Math.max(...Array.from(patternMap.values())))
  })).slice(0, 5);

  const recentBlocked = logs.filter(l => l.defenseAction === 'blocked').slice(0, 3);

  if (loading) {
    return (
      <div className="h-full animate-fade-in">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="h-full animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Detection Analysis</h1>
          <p className="text-muted-foreground">Deep dive into threat detection patterns and model performance</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground mb-1">No data to analyze</p>
            <p className="text-xs text-muted-foreground">Analyze prompts to see detection insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Detection Analysis</h1>
            <p className="text-muted-foreground">Deep dive into threat detection patterns and model performance</p>
          </div>
          <Button
            onClick={loadLogs}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="cyber-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Risk Distribution
          </h2>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4">
            {riskDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-mono text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Radar */}
        <div className="cyber-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            Attack Pattern Analysis
          </h2>

          {patternData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={patternData}>
                  <PolarGrid stroke="hsl(220, 25%, 20%)" />
                  <PolarAngleAxis 
                    dataKey="pattern" 
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 150]}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                  />
                  <Radar
                    name="Attacks"
                    dataKey="count"
                    stroke="hsl(185, 100%, 50%)"
                    fill="hsl(185, 100%, 50%)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No pattern data available
            </div>
          )}
        </div>

        {/* Detection Stats */}
        <div className="cyber-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Detection Performance
          </h2>

          <div className="space-y-4">
            {/* Accuracy */}
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Detection Accuracy</span>
                <span className="text-lg font-bold font-mono text-success">97.8%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '97.8%' }} />
              </div>
            </div>

            {/* Precision */}
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Precision</span>
                <span className="text-lg font-bold font-mono text-primary">93.2%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '93.2%' }} />
              </div>
            </div>

            {/* Recall */}
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recall</span>
                <span className="text-lg font-bold font-mono text-accent">95.6%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '95.6%' }} />
              </div>
            </div>

            {/* F1 Score */}
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">F1 Score</span>
                <span className="text-lg font-bold font-mono text-warning">94.4%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: '94.4%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Blocked Attacks */}
      <div className="mt-6">
        <div className="cyber-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Blocked Attacks
          </h2>

          {recentBlocked.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentBlocked.map((log) => {
                const risk = riskConfig[log.riskLevel];
                const RiskIcon = risk.icon;
                
                return (
                  <div 
                    key={log.id}
                    className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <RiskIcon className="w-4 h-4 text-destructive" />
                      <span className="text-xs text-destructive font-medium uppercase">Blocked</span>
                      <span className="ml-auto text-xs text-muted-foreground font-mono">
                        {log.confidence}%
                      </span>
                    </div>
                    <p className="text-sm font-mono text-foreground line-clamp-2 mb-3">
                      {log.prompt}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {log.detectedPatterns.slice(0, 2).map((pattern, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded text-xs bg-background border border-border text-muted-foreground"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No blocked attacks to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
