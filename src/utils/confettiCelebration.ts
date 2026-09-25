import confetti from 'canvas-confetti';

/**
 * Multi-stage eco festive confetti celebration
 * Fires cannons from left, right, and center with eco emerald, cyan, and vibrant green palettes
 */
export const triggerFestiveCelebration = () => {
  try {
    // Burst 1: Center greeting explosion
    confetti({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#34d399', '#67e8f9', '#a7f3d0'],
      disableForReducedMotion: true,
    });

    // Burst 2: Left eco cannon
    setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 60,
        spread: 70,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#10b981', '#14b8a6', '#22c55e', '#3b82f6', '#6ee7b7'],
        disableForReducedMotion: true,
      });
    }, 250);

    // Burst 3: Right eco cannon
    setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 120,
        spread: 70,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#06b6d4', '#10b981', '#10b981', '#67e8f9', '#34d399'],
        disableForReducedMotion: true,
      });
    }, 500);

    // Burst 4: Shimmering cyan & emerald stars from top
    setTimeout(() => {
      confetti({
        particleCount: 65,
        spread: 140,
        startVelocity: 35,
        origin: { y: 0.35 },
        colors: ['#34d399', '#38bdf8', '#ffffff', '#10b981'],
        shapes: ['circle'],
        disableForReducedMotion: true,
      });
    }, 850);
  } catch (err) {
    console.warn('Confetti animation error:', err);
  }
};

/**
 * Synthesizes a gentle celebratory futuristic chime using browser Web Audio API
 */
export const playCelebrationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Celebratory harmonic chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = ctx.currentTime + index * 0.09;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.95);
    });
  } catch {
    // Non-blocking fallback if browser policy restricts audio
  }
};
