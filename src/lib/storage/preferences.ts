export type ReaderTheme = 'paper' | 'sepia' | 'charcoal' | 'nord' | 'oled';
export type ReaderFont = 'serif' | 'sans' | 'mono';

export interface UserPreferences {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // e.g. 1.75
  maxWidth: number; // e.g. 720
  bionicReading: boolean;
  autoArchiveOnComplete: boolean;
  dailyGoalWords: number;
}

const PREF_KEY = 'omnivault_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'charcoal',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.75,
  maxWidth: 720,
  bionicReading: false,
  autoArchiveOnComplete: false,
  dailyGoalWords: 2000,
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed loading preferences, using defaults:', err);
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    // Apply theme attribute to body
    document.body.setAttribute('data-theme', prefs.theme);
  } catch (err) {
    console.warn('Failed saving preferences:', err);
  }
}
