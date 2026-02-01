// Risk levels for prompt analysis
export type RiskLevel = 'safe' | 'suspicious' | 'malicious';

// Defense actions taken
export type DefenseAction = 'allowed' | 'sanitized' | 'blocked';

// Defense mode
export type DefenseMode = 'strict' | 'adaptive';

// Attack pattern types
export interface AttackPattern {
  id: string;
  name: string;
  description: string;
  severity: RiskLevel;
  icon: string;
}

// Analysis result
export interface AnalysisResult {
  riskLevel: RiskLevel;
  confidence: number;
  detectedPatterns: AttackPattern[];
  suspiciousPhrases: Array<{
    text: string;
    reason: string;
    severity: RiskLevel;
  }>;
  reasoning: string;
  defenseAction: DefenseAction;
  sanitizedPrompt?: string;
  originalResponse?: string;
  safeResponse: string;
}

// Prompt log entry
export interface PromptLogEntry {
  id: string;
  timestamp: Date;
  promptSnippet: string;
  fullPrompt: string;
  riskLevel: RiskLevel;
  action: DefenseAction;
  confidence: number;
  analysisResult: AnalysisResult;
}

// Metrics data
export interface MetricsData {
  totalPrompts: number;
  blockedAttacks: number;
  falsePositives: number;
  averageLatency: number;
  promptsOverTime: Array<{ date: string; count: number; blocked: number }>;
  attackTypeDistribution: Array<{ type: string; count: number }>;
  confidenceHistogram: Array<{ range: string; count: number }>;
}

// Security policy
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'detection' | 'blocking' | 'protection';
}

// Forbidden phrase
export interface ForbiddenPhrase {
  id: string;
  phrase: string;
  severity: RiskLevel;
  addedAt: Date;
}

// Security settings
export interface SecuritySettings {
  policies: SecurityPolicy[];
  confidenceThreshold: number;
  forbiddenPhrases: ForbiddenPhrase[];
}

// Navigation items
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
