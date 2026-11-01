export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const DAY_LABELS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DAYS_OF_WEEK = [
  { id: 'MONDAY', label: 'M', full: 'Monday' },
  { id: 'TUESDAY', label: 'T', full: 'Tuesday' },
  { id: 'WEDNESDAY', label: 'W', full: 'Wednesday' },
  { id: 'THURSDAY', label: 'T', full: 'Thursday' },
  { id: 'FRIDAY', label: 'F', full: 'Friday' },
  { id: 'SATURDAY', label: 'S', full: 'Saturday' },
  { id: 'SUNDAY', label: 'S', full: 'Sunday' },
];

export const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export function formatDaysOfWeek(days = []) {
  if (!Array.isArray(days) || days.length === 0) return 'No days';
  if (days.length === 7) return 'Every day';
  const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const weekends = ['SATURDAY', 'SUNDAY'];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && weekends.every((d) => days.includes(d))) return 'Weekends';
  const abbrMap = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun',
  };
  return DAYS_OF_WEEK.filter((d) => days.includes(d.id)).map((d) => abbrMap[d.id]).join(', ');
}

export function browserTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftIso(iso, days) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function formatDisplayDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function scheduleLabel(days) {
  if (!Array.isArray(days)) return 'No days set';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [0, 1, 2, 3, 4].every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && [5, 6].every((d) => days.includes(d))) return 'Weekends';
  if (days.length === 0) return 'No days set';
  return days.map((d) => DAY_LABELS[d]).join(' · ');
}

export function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
