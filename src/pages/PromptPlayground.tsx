import { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Eye,
  Unlock,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wifi,
  WifiOff,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { AnalysisResult, RiskLevel } from '@/types/dashboard';
import { simulateAnalysis } from '@/data/mockData';
import { OllamaService } from '@/services/ollamaService';
import indexedDBService from '@/services/indexedDBService';
import securitySettingsService from '@/services/securitySettingsService';
import { useToast } from '@/hooks/use-toast';

const riskConfig = {
  safe: {
    icon: ShieldCheck,
    label: 'Safe',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    glow: 'pulse-safe'
  },
  suspicious: {
    icon: ShieldAlert,
    label: 'Suspicious',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    glow: 'pulse-warning'
  },
  malicious: {
    icon: ShieldX,
    label: 'Malicious',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    glow: 'pulse-danger'
  }
};

const actionConfig = {
  allowed: { label: 'Allowed', color: 'text-success', bg: 'bg-success/10' },
  sanitized: { label: 'Sanitized', color: 'text-warning', bg: 'bg-warning/10' },
  blocked: { label: 'Blocked', color: 'text-destructive', bg: 'bg-destructive/10' }
};

const patternIcons: Record<string, React.ElementType> = {
  AlertTriangle,
  ShieldAlert,
  Database,
  Unlock,
  Eye
};

export function PromptPlayground() {
  const [prompt, setPrompt] = useState('');
  const [attackMode, setAttackMode] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [useOllama, setUseOllama] = useState(true);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const { toast } = useToast();

  const charCount = prompt.length;
  const tokenCount = useMemo(() => Math.ceil(prompt.split(/\s+/).filter(Boolean).length * 1.3), [prompt]);

  useEffect(() => {
    checkOllamaConnection();
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      await indexedDBService.init();
      console.log('IndexedDB initialized');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      toast({
        title: 'Storage Warning',
        description: 'Local storage initialization failed. Logs may not be saved.',
        variant: 'destructive',
      });
    }
  };

  const checkOllamaConnection = async () => {
    const connected = await OllamaService.testConnection();
    setOllamaConnected(connected);
    if (!connected && useOllama) {
      toast({
        title: 'Ollama not connected',
        description: 'Make sure Ollama is running on localhost:11434. Falling back to mock analysis.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      let result: AnalysisResult;
      let analysisMethod: 'ollama' | 'mock' = 'mock';
      
      if (useOllama && ollamaConnected) {
        // Use Ollama for real analysis
        result = await OllamaService.analyzePrompt(prompt);
        analysisMethod = 'ollama';
        toast({
          title: 'Analysis Complete',
          description: 'Prompt analyzed using Ollama Gemma 3:1b',
        });
      } else {
        // Fallback to mock analysis
        await new Promise(resolve => setTimeout(resolve, 800));
        const settings = securitySettingsService.load();
        const forbiddenPhrases = settings?.forbiddenPhrases.map(p => ({
          phrase: p.phrase,
          severity: p.severity === 'safe' ? 'suspicious' : p.severity
        })) ?? [];
        result = simulateAnalysis(prompt, attackMode, forbiddenPhrases);
        if (useOllama && !ollamaConnected) {
          toast({
            title: 'Using Mock Analysis',
            description: 'Ollama is not available. Using simulated results.',
            variant: 'default',
          });
        }
      }
      
      setAnalysis(result);

      // Save to IndexedDB
      try {
        const logId = await indexedDBService.savePromptLog(result, prompt, analysisMethod);
        console.log('Log saved with ID:', logId);
        toast({
          title: 'Saved to Storage',
          description: 'Analysis has been logged successfully',
        });
      } catch (dbError) {
        console.error('Failed to save to IndexedDB:', dbError);
        toast({
          title: 'Storage Error',
          description: 'Analysis completed but failed to save locally',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Falling back to mock analysis',
        variant: 'destructive',
      });
      
      // Fallback to mock analysis on error
      await new Promise(resolve => setTimeout(resolve, 800));
      const settings = securitySettingsService.load();
      const forbiddenPhrases = settings?.forbiddenPhrases.map(p => ({
        phrase: p.phrase,
        severity: p.severity === 'safe' ? 'suspicious' : p.severity
      })) ?? [];
      const result = simulateAnalysis(prompt, attackMode, forbiddenPhrases);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const risk = analysis ? riskConfig[analysis.riskLevel] : null;
  const action = analysis ? actionConfig[analysis.defenseAction] : null;

  const highlightSuspicious = (text: string, phrases: AnalysisResult['suspiciousPhrases']) => {
    if (!phrases.length) return text;
    
    let result = text;
    phrases.forEach(({ text: phrase, severity }) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      const className = severity === 'malicious' ? 'highlight-danger' : 'highlight-suspicious';
      result = result.replace(regex, `<span class="${className}">$1</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="h-full animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Secure Prompt Playground</h1>
        <p className="text-muted-foreground">Test and analyze prompts for potential injection attacks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
        {/* Left Panel - Input */}
        <div className="cyber-card p-5 flex flex-col">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Prompt Input
          </h2>

          <div className="flex-1 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here to test for injection vulnerabilities..."
              className="flex-1 w-full bg-background border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none font-mono cyber-scrollbar"
            />

            {/* Counters */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>{charCount} characters</span>
              <span>~{tokenCount} tokens</span>
            </div>

            {/* Ollama Toggle */}
            <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2">
                {ollamaConnected ? (
                  <Wifi className="w-4 h-4 text-success" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Use Ollama Analysis</span>
                {ollamaConnected && (
                  <span className="text-xs text-success">(Connected)</span>
                )}
              </div>
              <Switch
                checked={useOllama}
                onCheckedChange={setUseOllama}
              />
            </div>

            {/* Attack Mode Toggle */}
            {!useOllama && (
              <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">Simulate Attack Mode</span>
                </div>
                <Switch
                  checked={attackMode}
                  onCheckedChange={setAttackMode}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isAnalyzing}
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Prompt
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Center Panel - Analysis */}
        <div className="cyber-card p-5 flex flex-col overflow-hidden">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Risk Assessment
          </h2>

          {!analysis ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Submit a prompt to see analysis results
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto cyber-scrollbar space-y-4 animate-fade-in">
              {/* Risk Level Card */}
              <div className={cn(
                "p-4 rounded-lg border",
                risk?.bg,
                risk?.border
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {risk && <risk.icon className={cn("w-5 h-5", risk.color)} />}
                    <span className={cn("font-semibold", risk?.color)}>{risk?.label}</span>
                  </div>
                  <div className={cn("w-3 h-3 rounded-full", risk?.color.replace('text-', 'bg-'), risk?.glow)} />
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl font-bold font-mono", risk?.color)}>
                    {analysis.confidence}%
                  </span>
                  <span className="text-sm text-muted-foreground">confidence</span>
                </div>
              </div>

              {/* Detected Patterns */}
              {analysis.detectedPatterns.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Detected Attack Patterns</h3>
                  <div className="space-y-2">
                    {analysis.detectedPatterns.map((pattern) => {
                      const Icon = patternIcons[pattern.icon] || AlertTriangle;
                      return (
                        <div 
                          key={pattern.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                        >
                          <Icon className={cn(
                            "w-4 h-4 flex-shrink-0",
                            pattern.severity === 'malicious' ? 'text-destructive' : 'text-warning'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{pattern.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pattern.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suspicious Phrases */}
              {analysis.suspiciousPhrases.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Highlighted Phrases</h3>
                  <div className="p-3 rounded-lg bg-background border border-border text-sm font-mono leading-relaxed">
                    {highlightSuspicious(prompt, analysis.suspiciousPhrases)}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Analysis Reasoning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-background border border-border">
                  {analysis.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Defense Action */}
        <div className="cyber-card p-5 flex flex-col overflow-hidden">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Defense Response
          </h2>

          {!analysis ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Awaiting analysis...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto cyber-scrollbar space-y-4 animate-fade-in">
              {/* Action Taken */}
              <div className={cn(
                "p-4 rounded-lg border text-center",
                action?.bg,
                action?.color === 'text-success' && 'border-success/30',
                action?.color === 'text-warning' && 'border-warning/30',
                action?.color === 'text-destructive' && 'border-destructive/30'
              )}>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Action Taken</span>
                <p className={cn("text-xl font-bold mt-1", action?.color)}>{action?.label}</p>
              </div>

              {/* Safe Response */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Safe Response</h3>
                <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-sm leading-relaxed">
                  {analysis.safeResponse}
                </div>
              </div>

              {/* Sanitized Prompt (if applicable) */}
              {analysis.sanitizedPrompt && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Sanitized Prompt</h3>
                  <div className="p-4 rounded-lg bg-warning/5 border border-warning/20 text-sm font-mono">
                    {analysis.sanitizedPrompt}
                  </div>
                </div>
              )}

              {/* Original Response (collapsible) */}
              {analysis.originalResponse && (
                <div>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    {showOriginal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Original LLM Response (Blocked)
                  </button>
                  {showOriginal && (
                    <div className="mt-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-sm font-mono text-muted-foreground animate-fade-in">
                      {analysis.originalResponse}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
