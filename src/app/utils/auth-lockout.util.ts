export type LoginRole = 'admin' | 'user';

const STORAGE_KEY = (role: LoginRole) => `login_lockout_${role}`;
const MSG_KEY = (role: LoginRole) => `login_lockout_msg_${role}`;

export function isAttemptsWarningMessage(message: string): boolean {
  const t = message.toLowerCase();
  if (t.includes('cuenta bloqueada') || t.includes('bloqueada temporalmente')) return false;
  return (
    t.includes('intentos restantes') ||
    t.includes('antes del bloqueo') ||
    (t.includes('intentos fallidos') && !t.includes('bloqueada'))
  );
}

export function isLockoutMessage(message: string): boolean {
  const t = message.toLowerCase();
  if (isAttemptsWarningMessage(message)) return false;

  return (
    t.includes('cuenta bloqueada') ||
    t.includes('bloqueada temporalmente') ||
    t.includes('bloqueado temporalmente') ||
    t.includes('usuario bloqueado') ||
    t.includes('ha sido bloqueada') ||
    t.includes('ha sido bloqueado') ||
    t.includes('múltiples intentos fallidos') ||
    t.includes('multiple intentos fallidos') ||
    (t.includes('bloquead') && (t.includes('minuto') || t.includes('segundo') || t.includes('desbloqueará')))
  );
}

export function parseLockoutSeconds(message: string): number | null {
  if (!isLockoutMessage(message)) return null;

  const text = message.toLowerCase();

  const waitMin = text.match(/tiempo de espera:\s*(\d+)\s*minutos?/);
  if (waitMin) return parseInt(waitMin[1], 10) * 60;

  const minMatch = text.match(/(\d+)\s*minutos?/);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;

  const secMatch = text.match(/(\d+)\s*segundos?/);
  if (secMatch) return parseInt(secMatch[1], 10);

  const unlockAt = text.match(/desbloquear[aá]\s*a las:\s*(\d{1,2}):(\d{2})/);
  if (unlockAt) {
    const now = new Date();
    const unlock = new Date();
    unlock.setHours(parseInt(unlockAt[1], 10), parseInt(unlockAt[2], 10), 0, 0);
    if (unlock.getTime() <= now.getTime()) unlock.setDate(unlock.getDate() + 1);
    return Math.max(1, Math.ceil((unlock.getTime() - now.getTime()) / 1000));
  }

  return 5 * 60;
}

export function getLockoutUntil(role: LoginRole): number | null {
  const raw = localStorage.getItem(STORAGE_KEY(role));
  if (!raw) return null;
  const until = parseInt(raw, 10);
  if (!Number.isFinite(until) || until <= Date.now()) {
    localStorage.removeItem(STORAGE_KEY(role));
    localStorage.removeItem(MSG_KEY(role));
    return null;
  }
  return until;
}

export function getLockoutMessage(role: LoginRole): string {
  return localStorage.getItem(MSG_KEY(role)) || '';
}

export function setLockout(role: LoginRole, seconds: number, message = ''): void {
  localStorage.setItem(STORAGE_KEY(role), String(Date.now() + seconds * 1000));
  if (message) localStorage.setItem(MSG_KEY(role), message);
}

export function clearLockout(role: LoginRole): void {
  localStorage.removeItem(STORAGE_KEY(role));
  localStorage.removeItem(MSG_KEY(role));
}

export function formatCountdown(totalSeconds: number): { mins: string; secs: string } {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return {
    mins: String(m).padStart(2, '0'),
    secs: String(r).padStart(2, '0'),
  };
}
