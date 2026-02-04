import type { AnalysisResult, RiskLevel } from '@/types/dashboard';

const DB_NAME = 'PromptSecurityDB';
const DB_VERSION = 1;
const STORE_NAME = 'promptLogs';

export interface StoredPromptLog {
  id?: number;
  timestamp: number;
  prompt: string;
  riskLevel: RiskLevel;
  confidence: number;
  defenseAction: 'allowed' | 'sanitized' | 'blocked';
  reasoning: string;
  detectedPatterns: string[];
  suspiciousPhrases: Array<{
    text: string;
    reason: string;
    severity: 'suspicious' | 'malicious';
  }>;
  sanitizedPrompt?: string;
  safeResponse: string;
  originalResponse?: string;
  analysisMethod: 'ollama' | 'mock';
  userAgent?: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for efficient querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('riskLevel', 'riskLevel', { unique: false });
          objectStore.createIndex('defenseAction', 'defenseAction', { unique: false });
          objectStore.createIndex('analysisMethod', 'analysisMethod', { unique: false });

          console.log('Object store created successfully');
        }
      };
    });
  }

  // Save a prompt log
  async savePromptLog(analysis: AnalysisResult, prompt: string, analysisMethod: 'ollama' | 'mock'): Promise<number> {
    await this.ensureDB();

    const log: StoredPromptLog = {
      timestamp: Date.now(),
      prompt,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      defenseAction: analysis.defenseAction,
      reasoning: analysis.reasoning,
      detectedPatterns: analysis.detectedPatterns.map(p => p.name),
      suspiciousPhrases: analysis.suspiciousPhrases.map(phrase => ({
        text: phrase.text,
        reason: phrase.reason,
        severity: phrase.severity === 'safe' ? 'suspicious' : phrase.severity as 'suspicious' | 'malicious'
      })),
      sanitizedPrompt: analysis.sanitizedPrompt,
      safeResponse: analysis.safeResponse,
      originalResponse: analysis.originalResponse,
      analysisMethod,
      userAgent: navigator.userAgent,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(log);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get all prompt logs (with optional filters)
  async getPromptLogs(filters?: {
    riskLevel?: RiskLevel;
    defenseAction?: 'allowed' | 'sanitized' | 'blocked';
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): Promise<StoredPromptLog[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        let logs = request.result as StoredPromptLog[];

        // Apply filters
        if (filters) {
          if (filters.riskLevel) {
            logs = logs.filter(log => log.riskLevel === filters.riskLevel);
          }
          if (filters.defenseAction) {
            logs = logs.filter(log => log.defenseAction === filters.defenseAction);
          }
          if (filters.startDate) {
            logs = logs.filter(log => log.timestamp >= filters.startDate!);
          }
          if (filters.endDate) {
            logs = logs.filter(log => log.timestamp <= filters.endDate!);
          }
        }

        // Sort by timestamp (newest first)
        logs.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        if (filters?.limit) {
          logs = logs.slice(0, filters.limit);
        }

        resolve(logs);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get a single log by ID
  async getLogById(id: number): Promise<StoredPromptLog | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete a log by ID
  async deleteLog(id: number): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all logs
  async clearAllLogs(): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get statistics
  async getStatistics(): Promise<{
    total: number;
    safe: number;
    suspicious: number;
    malicious: number;
    blocked: number;
    sanitized: number;
    allowed: number;
  }> {
    await this.ensureDB();

    const logs = await this.getPromptLogs();

    return {
      total: logs.length,
      safe: logs.filter(l => l.riskLevel === 'safe').length,
      suspicious: logs.filter(l => l.riskLevel === 'suspicious').length,
      malicious: logs.filter(l => l.riskLevel === 'malicious').length,
      blocked: logs.filter(l => l.defenseAction === 'blocked').length,
      sanitized: logs.filter(l => l.defenseAction === 'sanitized').length,
      allowed: logs.filter(l => l.defenseAction === 'allowed').length,
    };
  }

  // Get logs by date range
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<StoredPromptLog[]> {
    return this.getPromptLogs({
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    });
  }

  // Search logs by prompt text
  async searchLogs(searchTerm: string): Promise<StoredPromptLog[]> {
    const logs = await this.getPromptLogs();
    const lowerSearch = searchTerm.toLowerCase();
    
    return logs.filter(log => 
      log.prompt.toLowerCase().includes(lowerSearch) ||
      log.reasoning.toLowerCase().includes(lowerSearch)
    );
  }

  // Export logs as JSON
  async exportLogs(): Promise<string> {
    const logs = await this.getPromptLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Import logs from JSON
  async importLogs(jsonData: string): Promise<number> {
    const logs = JSON.parse(jsonData) as StoredPromptLog[];
    let imported = 0;

    for (const log of logs) {
      try {
        // Remove id to let IndexedDB auto-generate new ones
        const { id, ...logWithoutId } = log;
        await this.savePromptLog(
          {
            riskLevel: log.riskLevel,
            confidence: log.confidence,
            defenseAction: log.defenseAction,
            reasoning: log.reasoning,
            detectedPatterns: log.detectedPatterns.map((name, i) => ({
              id: String(i),
              name,
              description: '',
              severity: log.riskLevel === 'malicious' ? 'malicious' : 'suspicious',
              icon: 'AlertTriangle'
            })),
            suspiciousPhrases: log.suspiciousPhrases,
            sanitizedPrompt: log.sanitizedPrompt,
            safeResponse: log.safeResponse,
            originalResponse: log.originalResponse,
          },
          log.prompt,
          log.analysisMethod
        );
        imported++;
      } catch (error) {
        console.error('Failed to import log:', error);
      }
    }

    return imported;
  }

  // Ensure database is initialized
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export default new IndexedDBService();
