import React from 'react';
import { Modal } from '../common/Modal';
import { UserPreferences, ReaderTheme, ReaderFont } from '../../lib/storage/preferences';
import { Type, Sun, Moon, Eye, AlignLeft } from 'lucide-react';

interface ReaderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  const themes: { id: ReaderTheme; label: string; bg: string; text: string }[] = [
    { id: 'paper', label: 'Paper', bg: 'bg-[#faf9f5]', text: 'text-[#1f1e1d]' },
    { id: 'sepia', label: 'Sepia', bg: 'bg-[#f6eedb]', text: 'text-[#3d2f21]' },
    { id: 'charcoal', label: 'Dark', bg: 'bg-[#18191c]', text: 'text-[#f0f0f2]' },
    { id: 'nord', label: 'Nord', bg: 'bg-[#2e3440]', text: 'text-[#eceff4]' },
    { id: 'oled', label: 'OLED', bg: 'bg-[#000000]', text: 'text-[#ffffff]' },
  ];

  const fonts: { id: ReaderFont; label: string; sample: string }[] = [
    { id: 'serif', label: 'Serif', sample: 'Georgia / Cambria' },
    { id: 'sans', label: 'Sans-Serif', sample: 'System / Inter' },
    { id: 'mono', label: 'Monospace', sample: 'JetBrains / SF Mono' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reading Typography & Theme" maxWidth="max-w-md">
      <div className="space-y-6 text-xs">
        {/* Themes Palette */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            Reading Theme
          </label>
          <div className="grid grid-cols-5 gap-2">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => onUpdatePreferences({ ...preferences, theme: th.id })}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  th.bg
                } ${th.text} ${
                  preferences.theme === th.id
                    ? 'ring-2 ring-blue-500 border-transparent shadow-xs'
                    : 'border-[var(--border-color)] opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-[11px] font-medium">{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            Typeface
          </label>
          <div className="grid grid-cols-3 gap-2">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdatePreferences({ ...preferences, font: f.id })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  preferences.font === f.id
                    ? 'border-blue-500 bg-blue-500/10 font-semibold text-blue-600'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{f.sample}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span>Font Size</span>
            <span>{preferences.fontSize}px</span>
          </div>
          <input
            type="range"
            min="14"
            max="26"
            step="1"
            value={preferences.fontSize}
            onChange={(e) =>
              onUpdatePreferences({ ...preferences, fontSize: parseInt(e.target.value) })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Line Height Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span>Line Height</span>
            <span>{preferences.lineHeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="1.4"
            max="2.3"
            step="0.05"
            value={preferences.lineHeight}
            onChange={(e) =>
              onUpdatePreferences({ ...preferences, lineHeight: parseFloat(e.target.value) })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Content Column Max Width */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" />
              Column Width
            </span>
            <span>{preferences.maxWidth}px</span>
          </div>
          <input
            type="range"
            min="580"
            max="960"
            step="20"
            value={preferences.maxWidth}
            onChange={(e) =>
              onUpdatePreferences({ ...preferences, maxWidth: parseInt(e.target.value) })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Bionic Reading Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
          <div className="space-y-0.5">
            <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              Bionic Speed Reading
            </label>
            <p className="text-[11px] text-[var(--text-muted)]">
              Emboldens key syllables to guide natural eye movement.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.bionicReading}
            onChange={(e) =>
              onUpdatePreferences({ ...preferences, bionicReading: e.target.checked })
            }
            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          />
        </div>
      </div>
    </Modal>
  );
};
