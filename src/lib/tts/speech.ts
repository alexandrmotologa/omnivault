export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentChunkIndex: number;
  totalChunks: number;
  rate: number;
  pitch: number;
  selectedVoiceURI: string;
  availableVoices: SpeechSynthesisVoice[];
}

export type TTSCallback = (state: TTSState, activeText: string) => void;

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private chunks: string[] = [];
  private currentChunkIndex = 0;
  private isPlaying = false;
  private isPaused = false;
  private rate = 1.0;
  private pitch = 1.0;
  private selectedVoiceURI = '';
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<TTSCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    if (!this.selectedVoiceURI && this.voices.length > 0) {
      // Prefer English or natural/neural voices if available
      const preferred = this.voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')) && v.lang.startsWith('en')
      ) || this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0];
      if (preferred) {
        this.selectedVoiceURI = preferred.voiceURI;
      }
    }
    this.notify();
  }

  public subscribe(cb: TTSCallback): () => void {
    this.listeners.add(cb);
    cb(this.getState(), this.chunks[this.currentChunkIndex] || '');
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const state = this.getState();
    const activeText = this.chunks[this.currentChunkIndex] || '';
    this.listeners.forEach((cb) => cb(state, activeText));
  }

  public getState(): TTSState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentChunkIndex: this.currentChunkIndex,
      totalChunks: this.chunks.length,
      rate: this.rate,
      pitch: this.pitch,
      selectedVoiceURI: this.selectedVoiceURI,
      availableVoices: this.voices,
    };
  }

  public setVoice(voiceURI: string) {
    this.selectedVoiceURI = voiceURI;
    if (this.isPlaying && !this.isPaused) {
      // Restart current chunk with new voice
      this.speakCurrentChunk();
    } else {
      this.notify();
    }
  }

  public setRate(newRate: number) {
    this.rate = Math.min(2.5, Math.max(0.5, newRate));
    if (this.isPlaying && !this.isPaused) {
      this.speakCurrentChunk();
    } else {
      this.notify();
    }
  }

  public prepareArticle(title: string, markdownOrHtml: string) {
    this.stop();
    // Parse text into clean, speakable paragraph chunks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = markdownOrHtml;
    const rawParagraphs = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, blockquote, li'))
      .map((el) => el.textContent?.trim() || '')
      .filter((t) => t.length > 5);

    if (rawParagraphs.length === 0) {
      // Fallback: split by double newlines or punctuation
      const lines = markdownOrHtml.split(/\n\n+/).map((l) => l.replace(/[#*`_\[\]()]/g, '').trim()).filter((l) => l.length > 5);
      this.chunks = [title, ...lines];
    } else {
      this.chunks = [title, ...rawParagraphs];
    }

    this.currentChunkIndex = 0;
    this.notify();
  }

  public play() {
    if (!this.synth) return;
    if (this.isPaused) {
      this.synth.resume();
      this.isPlaying = true;
      this.isPaused = false;
      this.notify();
      return;
    }
    if (this.chunks.length === 0) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.speakCurrentChunk();
  }

  public pause() {
    if (!this.synth) return;
    this.synth.pause();
    this.isPaused = true;
    this.isPlaying = false;
    this.notify();
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.notify();
  }

  public nextChunk() {
    if (this.currentChunkIndex < this.chunks.length - 1) {
      this.currentChunkIndex++;
      if (this.isPlaying) {
        this.speakCurrentChunk();
      } else {
        this.notify();
      }
    } else {
      this.stop();
    }
  }

  public prevChunk() {
    if (this.currentChunkIndex > 0) {
      this.currentChunkIndex--;
      if (this.isPlaying) {
        this.speakCurrentChunk();
      } else {
        this.notify();
      }
    }
  }

  public jumpToChunk(index: number) {
    if (index >= 0 && index < this.chunks.length) {
      this.currentChunkIndex = index;
      if (this.isPlaying) {
        this.speakCurrentChunk();
      } else {
        this.notify();
      }
    }
  }

  private speakCurrentChunk() {
    if (!this.synth) return;
    this.synth.cancel();

    const text = this.chunks[this.currentChunkIndex];
    if (!text) {
      this.stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    if (this.selectedVoiceURI) {
      const voice = this.voices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        this.nextChunk();
      }
    };

    utterance.onerror = (e) => {
      // Canceled error is expected when changing chunks
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('TTS playback error:', e);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.notify();
  }
}

export const ttsEngine = new TTSEngine();
