export interface CountdownTime {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  is2027orLater: boolean;
  daysRemainingInYear: number;
}

export function getCountdownTo2027(fromDate: Date = new Date()): CountdownTime {
  const targetDate = new Date('2027-01-01T00:00:00');
  const now = fromDate.getTime();
  const targetTime = targetDate.getTime();
  const diff = targetTime - now;

  const is2027orLater = diff <= 0;

  if (is2027orLater) {
    // If we reached 2027, calculate remaining days in 2027!
    const endOf2027 = new Date('2027-12-31T23:59:59').getTime();
    const diff2027 = Math.max(0, endOf2027 - now);
    const totalSeconds = Math.floor(diff2027 / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      is2027orLater: true,
      daysRemainingInYear: days,
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    is2027orLater: false,
    daysRemainingInYear: days,
  };
}

export function formatDateSpanish(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPastNDays(n: number = 7): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

export function getDayAbbr(dateStr: string): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[d.getDay()];
}

export function getDayNumber(dateStr: string): number {
  const parts = dateStr.split('-');
  return parseInt(parts[2], 10);
}
