import type { SecuritySettings } from '@/types/dashboard';

const STORAGE_KEY = 'securitySettings';

interface StoredSecuritySettings {
  policies: SecuritySettings['policies'];
  confidenceThreshold: number;
  forbiddenPhrases: Array<Omit<SecuritySettings['forbiddenPhrases'][number], 'addedAt'> & { addedAt: number }>
}

const securitySettingsService = {
  load(): SecuritySettings | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as StoredSecuritySettings;
      return {
        policies: parsed.policies,
        confidenceThreshold: parsed.confidenceThreshold,
        forbiddenPhrases: parsed.forbiddenPhrases.map((phrase) => ({
          ...phrase,
          addedAt: new Date(phrase.addedAt),
        })),
      };
    } catch (error) {
      console.error('Failed to load security settings:', error);
      return null;
    }
  },

  save(settings: SecuritySettings): void {
    if (typeof window === 'undefined') return;

    const payload: StoredSecuritySettings = {
      policies: settings.policies,
      confidenceThreshold: settings.confidenceThreshold,
      forbiddenPhrases: settings.forbiddenPhrases.map((phrase) => ({
        ...phrase,
        addedAt: phrase.addedAt.getTime(),
      })),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save security settings:', error);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export default securitySettingsService;
