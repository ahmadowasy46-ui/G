/**
 * Luna AI HD Studio Audio Enhancer
 * Implements Web Audio API broadcast EQ, dynamics compression, and studio acoustic warmth
 * for podcast-grade, crystal-clear HDR voice reproduction (sounds like a real girl on a studio mic).
 */

class StudioAudioEnhancer {
  private audioCtx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private airFilter: BiquadFilterNode | null = null;

  private initContext() {
    if (this.audioCtx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();

      // 1. Highpass filter to eliminate sub-bass rumble (< 80Hz)
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 85;

      // 2. Vocal presence boost for crystal clear articulation (3.2kHz)
      this.presenceFilter = this.audioCtx.createBiquadFilter();
      this.presenceFilter.type = 'peaking';
      this.presenceFilter.frequency.value = 3200;
      this.presenceFilter.Q.value = 1.2;
      this.presenceFilter.gain.value = 3.5; // +3.5dB clarity

      // 3. Air shelf filter for realistic studio vocal shimmer (10kHz)
      this.airFilter = this.audioCtx.createBiquadFilter();
      this.airFilter.type = 'highshelf';
      this.airFilter.frequency.value = 10000;
      this.airFilter.gain.value = 2.5; // +2.5dB air

      // 4. Broadcast Dynamics Compressor (gentle leveling, podcast warmth)
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(3.2, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.22, this.audioCtx.currentTime);

      // Connect DSP chain: Highpass -> Presence -> Air -> Compressor -> Output
      this.highpassFilter.connect(this.presenceFilter);
      this.presenceFilter.connect(this.airFilter);
      this.airFilter.connect(this.compressor);
      this.compressor.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn('Web Audio Studio Enhancer unavailable:', err);
    }
  }

  /**
   * Play an audio URL through the HD Broadcast Studio DSP chain
   */
  public async playHDAudio(audioUrl: string): Promise<HTMLAudioElement> {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';

    try {
      this.initContext();
      if (this.audioCtx && this.highpassFilter) {
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        const source = this.audioCtx.createMediaElementSource(audio);
        source.connect(this.highpassFilter);
      }
    } catch (e) {
      // If MediaElementSource fails (e.g. CORS on some browsers), audio will still play natively
      console.warn('Direct studio DSP bridge bypassed; playing native audio element:', e);
    }

    await audio.play();
    return audio;
  }
}

export const studioAudio = new StudioAudioEnhancer();
