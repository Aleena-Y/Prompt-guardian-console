import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Settings, 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Plus, 
  Trash2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { attackPatterns } from '@/data/mockData';
import type { SecuritySettings, ForbiddenPhrase, RiskLevel } from '@/types/dashboard';
import securitySettingsService from '@/services/securitySettingsService';

const categoryIcons = {
  detection: Eye,
  blocking: Shield,
  protection: Lock
};

const severityColors = {
  suspicious: 'bg-warning/10 text-warning border-warning/30',
  malicious: 'bg-destructive/10 text-destructive border-destructive/30'
};

export function SecurityPolicies() {
  const defaultSettings = useMemo<SecuritySettings>(() => ({
    policies: attackPatterns.map((pattern) => ({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      enabled: true,
      category: 'detection',
    })),
    confidenceThreshold: 80,
    forbiddenPhrases: [],
  }), []);

  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [newPhrase, setNewPhrase] = useState('');
  const [newSeverity, setNewSeverity] = useState<RiskLevel>('suspicious');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const stored = securitySettingsService.load();
    if (stored) {
      setSettings(stored);
    }
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    securitySettingsService.save(settings);
  }, [settings]);

  const togglePolicy = (policyId: string) => {
    setSettings(prev => ({
      ...prev,
      policies: prev.policies.map(p =>
        p.id === policyId ? { ...p, enabled: !p.enabled } : p
      )
    }));
    setHasUnsavedChanges(true);
  };

  const updateThreshold = (value: number[]) => {
    setSettings(prev => ({ ...prev, confidenceThreshold: value[0] }));
    setHasUnsavedChanges(true);
  };

  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    
    const phrase: ForbiddenPhrase = {
      id: Date.now().toString(),
      phrase: newPhrase.trim().toLowerCase(),
      severity: newSeverity,
      addedAt: new Date()
    };

    setSettings(prev => ({
      ...prev,
      forbiddenPhrases: [...prev.forbiddenPhrases, phrase]
    }));
    setNewPhrase('');
    setHasUnsavedChanges(true);
  };

  const removePhrase = (phraseId: string) => {
    setSettings(prev => ({
      ...prev,
      forbiddenPhrases: prev.forbiddenPhrases.filter(p => p.id !== phraseId)
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    securitySettingsService.save(settings);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    securitySettingsService.clear();
    setSettings(defaultSettings);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="h-full animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Security Policies</h1>
          <p className="text-muted-foreground">Configure detection rules and defense thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasUnsavedChanges}
          >
          <Save className="w-4 h-4" />
          Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Rules */}
        <div className="cyber-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Detection Rules
          </h2>

          <div className="space-y-3">
            {settings.policies.map((policy) => {
              const Icon = categoryIcons[policy.category];
              
              return (
                <div
                  key={policy.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    policy.enabled 
                      ? "bg-background border-primary/30" 
                      : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        policy.enabled ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          policy.enabled ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          policy.enabled ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {policy.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {policy.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => togglePolicy(policy.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-6">
          <div className="cyber-card p-5">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Confidence Threshold
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Minimum confidence score to trigger action
                </span>
                <span className="text-2xl font-bold font-mono text-primary">
                  {settings.confidenceThreshold}%
                </span>
              </div>

              <Slider
                value={[settings.confidenceThreshold]}
                onValueChange={updateThreshold}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More False Positives</span>
                <span>More Permissive</span>
              </div>

              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="text-xs text-warning">
                  Lower thresholds increase security but may flag legitimate prompts. 
                  Recommended range: 70-85%
                </p>
              </div>
            </div>
          </div>

          {/* Forbidden Phrases */}
          <div className="cyber-card p-5">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Forbidden Phrases
            </h2>

            {/* Add New Phrase */}
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Enter forbidden phrase..."
                className="flex-1 bg-background border-border"
                onKeyDown={(e) => e.key === 'Enter' && addPhrase()}
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as RiskLevel)}
                className="h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="suspicious">Suspicious</option>
                <option value="malicious">Malicious</option>
              </select>
              <Button
                onClick={addPhrase}
                disabled={!newPhrase.trim()}
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Phrase List */}
            <div className="space-y-2 max-h-64 overflow-y-auto cyber-scrollbar">
              {settings.forbiddenPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border group"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium border",
                      severityColors[phrase.severity === 'safe' ? 'suspicious' : phrase.severity]
                    )}>
                      {phrase.severity}
                    </span>
                    <span className="text-sm font-mono text-foreground">{phrase.phrase}</span>
                  </div>
                  <button
                    onClick={() => removePhrase(phrase.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
