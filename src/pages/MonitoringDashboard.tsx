import { useEffect, useMemo, useState } from 'react';
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import indexedDBService, { type StoredPromptLog } from '@/services/indexedDBService';
import { format, subDays } from 'date-fns';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: MetricCardProps) {
  const variants = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };

  return (
    <div className="cyber-card cyber-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          variant === 'default' && 'bg-primary/10',
          variant === 'success' && 'bg-success/10',
          variant === 'warning' && 'bg-warning/10',
          variant === 'danger' && 'bg-destructive/10'
        )}>
          <Icon className={cn("w-5 h-5", variants[variant])} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.value > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            <TrendingUp className={cn("w-3 h-3", trend.value < 0 && 'rotate-180')} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold font-mono", variants[variant])}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const COLORS = ['hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)', 'hsl(160, 84%, 40%)', 'hsl(185, 100%, 50%)', 'hsl(220, 40%, 50%)'];

export function MonitoringDashboard() {
  const [logs, setLogs] = useState<StoredPromptLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        await indexedDBService.init();
        const fetchedLogs = await indexedDBService.getPromptLogs();
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Failed to load dashboard logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const metrics = useMemo(() => {
    const totalPrompts = logs.length;
    const blockedAttacks = logs.filter((log) => log.defenseAction === 'blocked').length;
    const falsePositives = logs.filter(
      (log) => log.defenseAction === 'blocked' && log.riskLevel === 'safe'
    ).length;
    const averageConfidence = totalPrompts
      ? Math.round(logs.reduce((sum, log) => sum + log.confidence, 0) / totalPrompts)
      : 0;

    const last7Days = Array.from({ length: 7 }, (_, index) => subDays(new Date(), 6 - index));
    const dailyBuckets = new Map(
      last7Days.map((day) => [format(day, 'yyyy-MM-dd'), { count: 0, blocked: 0 }])
    );

    logs.forEach((log) => {
      const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
      const bucket = dailyBuckets.get(dateKey);
      if (!bucket) return;
      bucket.count += 1;
      if (log.defenseAction === 'blocked') {
        bucket.blocked += 1;
      }
    });

    const promptsOverTime = Array.from(dailyBuckets.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      blocked: data.blocked,
    }));

    const patternCounts = new Map<string, number>();
    logs.forEach((log) => {
      if (log.detectedPatterns.length === 0) return;
      log.detectedPatterns.forEach((pattern) => {
        patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
      });
    });

    const attackTypeDistribution = patternCounts.size
      ? Array.from(patternCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({ type, count }))
      : [{ type: 'No detections', count: 0 }];

    const histogramBins = [
      { range: '0-50%', min: 0, max: 50 },
      { range: '50-60%', min: 50, max: 60 },
      { range: '60-70%', min: 60, max: 70 },
      { range: '70-80%', min: 70, max: 80 },
      { range: '80-90%', min: 80, max: 90 },
      { range: '90-100%', min: 90, max: 101 },
    ];

    const confidenceHistogram = histogramBins.map((bin) => ({
      range: bin.range,
      count: logs.filter((log) => log.confidence >= bin.min && log.confidence < bin.max).length,
    }));

    return {
      totalPrompts,
      blockedAttacks,
      falsePositives,
      averageConfidence,
      promptsOverTime,
      attackTypeDistribution,
      confidenceHistogram,
    };
  }, [logs]);

  return (
    <div className="h-full animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Monitoring Dashboard</h1>
        <p className="text-muted-foreground">Real-time security metrics and attack analytics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Prompts"
          value={metrics.totalPrompts.toLocaleString()}
          subtitle={loading ? 'Loading logs...' : 'From prompt logs'}
          icon={Activity}
        />
        <MetricCard
          title="Blocked Attacks"
          value={metrics.blockedAttacks}
          subtitle={
            metrics.totalPrompts
              ? `${((metrics.blockedAttacks / metrics.totalPrompts) * 100).toFixed(1)}% of total`
              : '0% of total'
          }
          icon={Shield}
          variant="danger"
        />
        <MetricCard
          title="False Positives"
          value={metrics.falsePositives}
          subtitle={
            metrics.blockedAttacks
              ? `${((metrics.falsePositives / metrics.blockedAttacks) * 100).toFixed(1)}% of blocked`
              : '0% of blocked'
          }
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="Avg. Confidence"
          value={metrics.averageConfidence ? `${metrics.averageConfidence}%` : '—'}
          subtitle="Detection confidence"
          icon={Clock}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Prompts Over Time */}
        <div className="cyber-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Prompt Injection Attempts Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.promptsOverTime}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 20%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 20%, 55%)" 
                  fontSize={12}
                  tickFormatter={(value) => value.split('-')[2]}
                />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 40%, 10%)', 
                    border: '1px solid hsl(220, 25%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(185, 100%, 50%)" 
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                  name="Total Prompts"
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="hsl(0, 72%, 51%)" 
                  fillOpacity={1} 
                  fill="url(#colorBlocked)"
                  name="Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Type Distribution */}
        <div className="cyber-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Attack Type Distribution
          </h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.attackTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="count"
                >
                  {metrics.attackTypeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 40%, 10%)', 
                    border: '1px solid hsl(220, 25%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {metrics.attackTypeDistribution.map((item, index) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground flex-1">{item.type}</span>
                  <span className="text-xs font-mono text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Histogram */}
      <div className="cyber-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Risk Confidence Distribution
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.confidenceHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 20%)" />
              <XAxis dataKey="range" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(220, 40%, 10%)', 
                  border: '1px solid hsl(220, 25%, 20%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 98%)'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(185, 100%, 50%)" 
                radius={[4, 4, 0, 0]}
                name="Detections"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
