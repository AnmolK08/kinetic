export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'object' && error !== null) {
    if (typeof error.message === 'string') return error.message;
    if (typeof error.error === 'string') return error.error;
  }
  return fallback;
}
