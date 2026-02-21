class AudioSystem {
    private ctx: AudioContext | null = null;
    private initialized = false;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.initialized) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
            this.initialized = true;
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideFreq?: number) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(freq, now);
            if (slideFreq) {
                osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
            }

            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.start(now);
            osc.stop(now + duration + 0.1);
        } catch (e) {
            console.warn("Audio play failed, likely due to browser interaction policy.", e);
        }
    }

    playTap() {
        this.init();
        this.playTone(800, 'sine', 0.05, 0.05, 1200);
    }

    playSuccess() {
        this.init();
        if (!this.ctx) return;
        this.playTone(440, 'square', 0.1, 0.05);
        setTimeout(() => this.playTone(554, 'square', 0.1, 0.05), 100);
        setTimeout(() => this.playTone(659, 'square', 0.2, 0.05), 200);
    }

    playLevelUp() {
        this.init();
        if (!this.ctx) return;
        this.playTone(300, 'sawtooth', 0.1, 0.05, 500);
        setTimeout(() => this.playTone(400, 'sawtooth', 0.1, 0.05, 600), 100);
        setTimeout(() => this.playTone(500, 'sawtooth', 0.1, 0.05, 800), 200);
        setTimeout(() => this.playTone(800, 'square', 0.3, 0.05), 300);
    }

    playError() {
        this.init();
        this.playTone(200, 'sawtooth', 0.2, 0.05, 150);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.05, 100), 200);
    }
}

export const audio = new AudioSystem();
