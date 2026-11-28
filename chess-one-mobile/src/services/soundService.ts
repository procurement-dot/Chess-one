/**
 * Chess-One Audio & Sound Effects Service
 * Ultra-low latency, crisp, native Chess.com-style sound effects
 * Plus Coach One Text-to-Speech character voice system
 */
import * as Speech from 'expo-speech';

class SoundService {
  private audioCtx: any = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;
  private isSpeakingNow: boolean = false;

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
        } catch (e) {
          console.warn('Could not initialize AudioContext:', e);
        }
      }
    }
  }

  private ensureContext() {
    if (!this.audioCtx) {
      this.initContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingNow;
  }

  /**
   * 1. Standard Move Sound (Crisp wooden tap - Chess.com style)
   */
  public playMoveSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Primary acoustic transient (wood tap knock)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {
      console.warn('playMoveSound error:', e);
    }
  }

  /**
   * 2. Capture Sound (Sharp, energetic strike impact - Chess.com style)
   */
  public playCaptureSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Layer 1: Sharp high crack
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain1.gain.setValueAtTime(0.65, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Layer 2: Deep body thump
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(70, now + 0.1);
      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.11);
    } catch (e) {
      console.warn('playCaptureSound error:', e);
    }
  }

  /**
   * 3. Check Alert Sound (Harmonic crystal alert chime - Chess.com style)
   */
  public playCheckSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Dual harmonic bell ringing
      [660, 880].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      });
    } catch (e) {
      console.warn('playCheckSound error:', e);
    }
  }

  /**
   * 4. Puzzle Solved / Victory Chime (Joyful uplifting victory arpeggio - Chess.com style)
   */
  public playSuccessSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // C-Major ascending arpeggio notes: G4 (392Hz), C5 (523Hz), E5 (659Hz), G5 (784Hz)
      const notes = [
        { freq: 392, delay: 0.0 },
        { freq: 523.25, delay: 0.08 },
        { freq: 659.25, delay: 0.16 },
        { freq: 783.99, delay: 0.24 },
      ];

      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.45, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
      });
    } catch (e) {
      console.warn('playSuccessSound error:', e);
    }
  }

  /**
   * 5. Wrong Move Sound (Dull error thud / bounce back - Chess.com style)
   */
  public playWrongSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('playWrongSound error:', e);
    }
  }

  /**
   * ========================================================
   * Coach One Text-to-Speech (TTS) Character Voice Engine
   * Speaks Coach feedback, tactics tips, and victory lines
   * ========================================================
   */

  /**
   * Cleans emojis and transforms chess notation (e.g., Qxf7#) into smooth spoken English
   */
  public formatSpeechLine(rawText: string): string {
    if (!rawText) return '';

    // Take the punchy primary coach sentence (strip technical second paragraph if present)
    let text = rawText.split('\n')[0].trim();
    if (!text || text.length < 5) {
      text = rawText.replace(/\n+/g, ' ').trim();
    }

    // Strip emojis
    text = text.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu,
      ''
    );

    // Strip markdown formatting symbols
    text = text.replace(/[*_#~`]/g, '');

    // Convert Chess notation into spoken natural words
    text = text.replace(/\bQ([a-h][1-8])\b/g, 'Queen to $1');
    text = text.replace(/\bR([a-h][1-8])\b/g, 'Rook to $1');
    text = text.replace(/\bB([a-h][1-8])\b/g, 'Bishop to $1');
    text = text.replace(/\bN([a-h][1-8])\b/g, 'Knight to $1');
    text = text.replace(/\bK([a-h][1-8])\b/g, 'King to $1');
    text = text.replace(/\bQx/g, 'Queen takes ');
    text = text.replace(/\bRx/g, 'Rook takes ');
    text = text.replace(/\bBx/g, 'Bishop takes ');
    text = text.replace(/\bNx/g, 'Knight takes ');
    text = text.replace(/\bKx/g, 'King takes ');
    text = text.replace(/#/g, ' checkmate');
    text = text.replace(/\+/g, ' check');

    // Clean multiple whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Stop any in-progress speech
   */
  public stopSpeech() {
    this.isSpeakingNow = false;
    try {
      Speech.stop();
    } catch {}
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Speaks Coach One's line out loud with cartoon/coach personality
   */
  public speakCoach(
    rawText: string,
    mood: 'idle' | 'wrong' | 'success' = 'idle',
    onFinish?: () => void
  ) {
    if (!this.voiceEnabled) return;
    this.stopSpeech();

    const spokenText = this.formatSpeechLine(rawText);
    if (!spokenText) return;

    // Cheerful, encouraging pitch (1.15 to 1.25) & crisp rate (0.95 to 1.05)
    const pitch = mood === 'success' ? 1.25 : mood === 'wrong' ? 1.05 : 1.15;
    const rate = mood === 'success' ? 1.02 : mood === 'wrong' ? 0.96 : 1.0;

    this.isSpeakingNow = true;

    try {
      Speech.speak(spokenText, {
        language: 'en-US',
        pitch,
        rate,
        onDone: () => {
          this.isSpeakingNow = false;
          if (onFinish) onFinish();
        },
        onStopped: () => {
          this.isSpeakingNow = false;
        },
        onError: (e) => {
          this.isSpeakingNow = false;
          this.speakWebFallback(spokenText, pitch, rate, onFinish);
        },
      });
    } catch {
      this.speakWebFallback(spokenText, pitch, rate, onFinish);
    }
  }

  private speakWebFallback(
    text: string,
    pitch: number,
    rate: number,
    onFinish?: () => void
  ) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.lang = 'en-US';
        this.isSpeakingNow = true;

        utterance.onend = () => {
          this.isSpeakingNow = false;
          if (onFinish) onFinish();
        };
        utterance.onerror = () => {
          this.isSpeakingNow = false;
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        this.isSpeakingNow = false;
        console.warn('Web speech synthesis fallback error:', e);
      }
    }
  }
}

export const soundService = new SoundService();
