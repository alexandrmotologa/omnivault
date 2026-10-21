import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  Gauge,
  X,
} from 'lucide-react';
import { TTSState } from '../../lib/tts/speech';

interface TTSPlayerBarProps {
  ttsState: TTSState;
  activeText: string;
  articleTitle: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSetRate: (rate: number) => void;
  onSetVoice: (voiceURI: string) => void;
  onClose: () => void;
}

export const TTSPlayerBar: React.FC<TTSPlayerBarProps> = ({
  ttsState,
  activeText,
  articleTitle,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onSetRate,
  onSetVoice,
  onClose,
}) => {
  const rates = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-3 flex flex-col gap-2 animate-in slide-in-from-bottom duration-200 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Track Title & chunk progress */}
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="truncate">
            <h5 className="font-semibold text-[var(--text-primary)] truncate text-xs">
              {articleTitle}
            </h5>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {activeText ? `“${activeText.slice(0, 60)}...”` : 'Audio Player'}
            </p>
          </div>
        </div>

        {/* Counter and dismiss button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
            {ttsState.currentChunkIndex + 1} / {Math.max(1, ttsState.totalChunks)}
          </span>
          <button
            onClick={() => {
              onStop();
              onClose();
            }}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            title="Close Audio Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playback Controls & Voice / Speed Settings */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/60">
        {/* Main controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            title="Previous paragraph"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {ttsState.isPlaying && !ttsState.isPaused ? (
            <button
              onClick={onPause}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              title="Play"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onNext}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            title="Next paragraph"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onStop}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-secondary)]"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed presets */}
        <div className="flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5 text-[var(--text-muted)] mr-1 hidden sm:inline-block" />
          {rates.map((r) => (
            <button
              key={r}
              onClick={() => onSetRate(r)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                ttsState.rate === r
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Voice selector */}
        {ttsState.availableVoices.length > 0 && (
          <div className="hidden md:flex items-center max-w-[150px]">
            <select
              value={ttsState.selectedVoiceURI}
              onChange={(e) => onSetVoice(e.target.value)}
              className="w-full text-[11px] py-1 px-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] truncate focus:outline-none"
            >
              {ttsState.availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
