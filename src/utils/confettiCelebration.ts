import confetti from 'canvas-confetti';

/**
 * Multi-stage Royal Red & Gold heritage celebration with emerald eco accents
 */
export const triggerFestiveCelebration = () => {
  try {
    // Burst 1: Center gold & crimson explosion
    confetti({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#dc2626', '#b91c1c', '#10b981', '#fef08a'],
      disableForReducedMotion: true,
    });

    // Burst 2: Left royal gold cannon
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 75,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#f59e0b', '#d97706', '#dc2626', '#10b981', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 200);

    // Burst 3: Right royal gold cannon
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 75,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#f59e0b', '#fbbf24', '#b91c1c', '#10b981', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 450);

    // Burst 4: Shimmering gold stars from top
    setTimeout(() => {
      confetti({
        particleCount: 70,
        spread: 140,
        startVelocity: 35,
        origin: { y: 0.35 },
        colors: ['#fbbf24', '#f59e0b', '#fef08a', '#10b981'],
        shapes: ['circle'],
        disableForReducedMotion: true,
      });
    }, 750);
  } catch (err) {
    console.warn('Confetti animation notice:', err);
  }
};

/**
 * Silent no-op replacement: Sound effects have been removed in favor of
 * smooth, professional visual Framer Motion animations.
 */
export const playCelebrationChime = () => {
  // Purely visual feedback; all audio sound effects and beeps are removed per requirement.
};
