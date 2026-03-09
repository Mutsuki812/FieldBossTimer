import { toZonedTime, format as formatTz } from 'date-fns-tz';

export const TW_TIMEZONE = 'Asia/Taipei';

// Get current date locked to Taiwan time
export function getTWTime(): Date {
  return toZonedTime(new Date(), TW_TIMEZONE);
}

// Format a date exactly in Taiwan time
export function formatTW(date: Date | number | string, formatStr: string): string {
  const d = new Date(date);
  const zonedDate = toZonedTime(d, TW_TIMEZONE);
  return formatTz(zonedDate, formatStr, { timeZone: TW_TIMEZONE });
}

// Synthesize a brief elegant beep for schedule reminders
export function playReminderBeep() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio synthesis not supported or blocked");
  }
}
