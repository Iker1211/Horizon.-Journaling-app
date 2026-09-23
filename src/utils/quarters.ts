import { ClayColor } from '../types';
import { getTodayDateString } from './dates';

export type QuarterId = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterInfo {
  id: QuarterId;
  name: string; // 'Q1'
  title: string; // 'Q1 — Primer Cuarto'
  subtitle: string; // 'Fundamentos & Despegue'
  startDayNumber: number; // 1
  endDayNumber: number; // 91
  totalDays: number; // 91
  startDateStr: string; // 'YYYY-MM-DD'
  endDateStr: string; // 'YYYY-MM-DD'
  status: 'completed' | 'active' | 'upcoming';
  daysElapsed: number;
  daysRemaining: number;
  progressPercent: number;
  color: ClayColor;
}

export interface Year365Cycle {
  startDateStr: string;
  endDateStr: string;
  todayStr: string;
  currentDayNumber: number; // 1 to 365
  daysRemainingInYear: number;
  progressPercent: number;
  currentQuarterId: QuarterId;
  currentQuarter: QuarterInfo;
  quarters: QuarterInfo[];
  isCycleCompleted: boolean;
  cycleNumber: number;
}

const STORAGE_KEY_START_DATE = 'clay_2027_app_start_date';

/**
 * Parses YYYY-MM-DD to local Date object at midnight without UTC shifting issues.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function formatToDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds N days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatToDateStr(dt);
}

/**
 * Calculates day difference (toStr - fromStr).
 */
export function diffDays(fromStr: string, toStr: string): number {
  const dt1 = parseLocalDate(fromStr);
  const dt2 = parseLocalDate(toStr);
  return Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 3600 * 24));
}

/**
 * Retrieves the stored start date of the user's 365-day year.
 * If not set, initializes it to today and persists it.
 */
export function getAppStartDate(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_START_DATE);
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      return saved;
    }
    const today = getTodayDateString();
    localStorage.setItem(STORAGE_KEY_START_DATE, today);
    return today;
  } catch {
    return getTodayDateString();
  }
}

/**
 * Updates the user's 365-day year start date.
 */
export function saveAppStartDate(startDateStr: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_START_DATE, startDateStr);
  } catch (err) {
    console.warn('Failed to save start date:', err);
  }
}

/**
 * Quarter configuration templates:
 * Q1: Days 1 - 91 (91 days)
 * Q2: Days 92 - 182 (91 days)
 * Q3: Days 183 - 273 (91 days)
 * Q4: Days 274 - 365 (92 days)
 * Total: 365 days
 */
export interface QuarterDefinition {
  id: QuarterId;
  name: string;
  title: string;
  subtitle: string;
  startOffset: number;
  dayCount: number;
  startDayNum: number;
  endDayNum: number;
  color: ClayColor;
}

export const QUARTER_DEFINITIONS: QuarterDefinition[] = [
  {
    id: 'Q1',
    name: 'Q1',
    title: 'Q1 — Primer Cuarto',
    subtitle: 'Fundamentos & Despegue',
    startOffset: 0,
    dayCount: 91,
    startDayNum: 1,
    endDayNum: 91,
    color: 'teal',
  },
  {
    id: 'Q2',
    name: 'Q2',
    title: 'Q2 — Segundo Cuarto',
    subtitle: 'Aceleración & Tracción',
    startOffset: 91,
    dayCount: 91,
    startDayNum: 92,
    endDayNum: 182,
    color: 'pink',
  },
  {
    id: 'Q3',
    name: 'Q3',
    title: 'Q3 — Tercer Cuarto',
    subtitle: 'Consolidación & Escala',
    startOffset: 182,
    dayCount: 91,
    startDayNum: 183,
    endDayNum: 273,
    color: 'ochre',
  },
  {
    id: 'Q4',
    name: 'Q4',
    title: 'Q4 — Cuarto Cuarto',
    subtitle: 'Cierre & Conquista 365',
    startOffset: 273,
    dayCount: 92,
    startDayNum: 274,
    endDayNum: 365,
    color: 'coral',
  },
];

/**
 * Calculates full 365-day year and 4 quarters model given a start date and reference date.
 */
export function calculate365Cycle(
  startDateStr: string = getAppStartDate(),
  todayStr: string = getTodayDateString()
): Year365Cycle {
  const daysDiff = diffDays(startDateStr, todayStr);
  
  // Cycle calculation in case user passes 365 days
  const cycleNumber = daysDiff >= 0 ? Math.floor(daysDiff / 365) + 1 : 1;
  // Day within the current 365-day cycle (1 to 365)
  let currentDayNumber: number;
  let isCycleCompleted = false;

  if (daysDiff < 0) {
    // Before start date
    currentDayNumber = 0;
  } else {
    currentDayNumber = (daysDiff % 365) + 1;
    if (daysDiff >= 365) {
      isCycleCompleted = true;
    }
  }

  const daysRemainingInYear = Math.max(0, 365 - currentDayNumber);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentDayNumber / 365) * 100)));
  const endDateStr = addDays(startDateStr, 364);

  // Build quarters array
  const quarters: QuarterInfo[] = QUARTER_DEFINITIONS.map(def => {
    const qStartDate = addDays(startDateStr, def.startOffset);
    const qEndDate = addDays(startDateStr, def.startOffset + def.dayCount - 1);

    let status: 'completed' | 'active' | 'upcoming' = 'upcoming';
    let daysElapsed = 0;

    if (currentDayNumber >= def.endDayNum) {
      status = 'completed';
      daysElapsed = def.dayCount;
    } else if (currentDayNumber >= def.startDayNum && currentDayNumber <= def.endDayNum) {
      status = 'active';
      daysElapsed = currentDayNumber - def.startDayNum + 1;
    } else {
      status = 'upcoming';
      daysElapsed = 0;
    }

    const daysRemaining = def.dayCount - daysElapsed;
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / def.dayCount) * 100)));

    return {
      id: def.id,
      name: def.name,
      title: def.title,
      subtitle: def.subtitle,
      startDayNumber: def.startDayNum,
      endDayNumber: def.endDayNum,
      totalDays: def.dayCount,
      startDateStr: qStartDate,
      endDateStr: qEndDate,
      status,
      daysElapsed,
      daysRemaining,
      progressPercent,
      color: def.color,
    };
  });

  const activeQ = quarters.find(q => q.status === 'active') || quarters[0];

  return {
    startDateStr,
    endDateStr,
    todayStr,
    currentDayNumber,
    daysRemainingInYear,
    progressPercent,
    currentQuarterId: activeQ.id,
    currentQuarter: activeQ,
    quarters,
    isCycleCompleted,
    cycleNumber,
  };
}

/**
 * Returns Quarter and day-of-cycle metadata for any date string.
 */
export function getQuarterForDate(
  targetDateStr: string,
  startDateStr: string = getAppStartDate()
): {
  quarterId: QuarterId | null;
  quarterName: string;
  dayNumberInYear: number | null;
  dayInQuarter: number | null;
  isWithinYear: boolean;
  statusLabel: string;
} {
  const diff = diffDays(startDateStr, targetDateStr);
  const dayNum = diff + 1;

  if (dayNum < 1 || dayNum > 365) {
    return {
      quarterId: null,
      quarterName: dayNum < 1 ? 'Previo' : 'Post-365',
      dayNumberInYear: null,
      dayInQuarter: null,
      isWithinYear: false,
      statusLabel: dayNum < 1 ? 'Antes del inicio' : 'Posterior al año',
    };
  }

  for (const def of QUARTER_DEFINITIONS) {
    if (dayNum >= def.startDayNum && dayNum <= def.endDayNum) {
      const dayInQ = dayNum - def.startDayNum + 1;
      return {
        quarterId: def.id,
        quarterName: def.name,
        dayNumberInYear: dayNum,
        dayInQuarter: dayInQ,
        isWithinYear: true,
        statusLabel: `${def.name} · Día ${dayInQ} de ${def.dayCount}`,
      };
    }
  }

  return {
    quarterId: null,
    quarterName: '',
    dayNumberInYear: dayNum,
    dayInQuarter: null,
    isWithinYear: false,
    statusLabel: '',
  };
}
