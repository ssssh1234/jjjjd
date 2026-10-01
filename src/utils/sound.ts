class SoundController {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic chip placement click
  playChip() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Card slide / deal sound
  playCard() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // White noise burst filtered as card swoosh
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Slot reel spin tick
  playSpinTick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  // Win chime
  playWin() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.26);
    });
  }

  // Big Jackpot celebration fanfare
  playJackpot() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.0],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66],
      [1046.5, 1318.51, 1567.98]
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + step * 0.12);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + step * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + step * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + step * 0.12);
        osc.stop(this.ctx.currentTime + step * 0.12 + 0.36);
      });
    });
  }

  // Loss or fold tone
  playLoss() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.21);
  }

  // Cashier coin shower / settlement credit sound
  playCashSettlement() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const freq = 1600 + Math.random() * 800;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
      }, i * 45);
    }
  }
}

export const sound = new SoundController();
