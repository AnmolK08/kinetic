export const DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/**
 * Normalizes any date input (YYYY-MM-DD string or Date instance)
 * to a clean UTC Midnight Date object (00:00:00.000Z).
 */
export const getUtcDateOnly = (dateInput) => {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T00:00:00.000Z`);
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
};

/**
 * Formats a Date object or string to YYYY-MM-DD string.
 */
export const formatDateIso = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Returns Monday and Sunday Date objects for the week containing referenceDate.
 */
export const getStartAndEndOfWeek = (referenceDate = new Date()) => {
  const ref = getUtcDateOnly(referenceDate);
  const day = ref.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: monday, end: sunday };
};

/**
 * Returns the first and last day dates of a specified month and year.
 */
export const getStartAndEndOfMonth = (month, year) => {
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getUTCFullYear();
  const m = month ? parseInt(month, 10) - 1 : now.getUTCMonth();

  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));

  return { start, end };
};
