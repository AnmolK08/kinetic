const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Standard HTTP request wrapper with auth header injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('kinetic_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isDemo = localStorage.getItem('kinetic-demo-mode') === 'true';
  if (isDemo && !token) {
    headers['x-user-id'] = 'demo-user-01';
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // If backend is not running or unreachable, propagate descriptive error
    throw new Error(`Network error: Could not connect to API server (${err.message})`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to parse response from server (${response.status} ${response.statusText})`);
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ==========================================
// 1. ROUTINE CORE APIS
// ==========================================

export async function fetchRoutines() {
  const res = await request('/routines');
  return res.routines || [];
}

export async function fetchRoutine(routineId) {
  const res = await request(`/routines/${routineId}`);
  return res.routine;
}

export async function createRoutine(input) {
  const res = await request('/routines', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.routine;
}

export async function updateRoutine(routineId, patch) {
  const res = await request(`/routines/${routineId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.routine;
}

export async function deleteRoutine(routineId) {
  return await request(`/routines/${routineId}`, {
    method: 'DELETE',
  });
}

export async function activateRoutine(routineId) {
  const res = await request(`/routines/${routineId}/activate`, {
    method: 'PATCH',
  });
  return res.routine;
}

// ==========================================
// 2. TASK APIS
// ==========================================

export async function addTask(routineId, taskData) {
  const res = await request(`/routines/${routineId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
  return res.task;
}

export async function updateTask(taskId, patch) {
  const res = await request(`/routines/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.task;
}

export async function deleteTask(taskId) {
  return await request(`/routines/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function fetchTaskPerformance(taskId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await request(`/routines/tasks/${taskId}/performance${q}`);
  return res.performance;
}

// ==========================================
// 3. TODAY & DAILY LOG APIS
// ==========================================

export async function fetchToday(customDate) {
  const q = customDate ? `?date=${encodeURIComponent(customDate)}` : '';
  const res = await request(`/routines/today${q}`);
  return res;
}

export async function fetchRoutineDay(date) {
  const res = await request(`/routines/days/${date}`);
  return res.routineDay;
}

export async function updateTaskLog(dayId, taskLogId, status) {
  const res = await request(`/routines/days/${dayId}/tasks/${taskLogId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res;
}

// ==========================================
// 4. ANALYTICS & SUGGESTIONS APIS
// ==========================================

export async function fetchWeeklyAnalytics(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await request(`/routines/analytics/weekly${q}`);
  return res.stats;
}

export async function fetchMonthlyAnalytics(month, year) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await request(`/routines/analytics/monthly${q}`);
  return res.stats;
}

export async function fetchSuggestions() {
  const res = await request('/routines/suggestions');
  return res;
}

export async function fetchOverviewAnalytics() {
  const res = await request('/analytics/overview');
  return res.data;
}

// ==========================================
// 5. AUTHENTICATION APIS
// ==========================================

export async function apiSignUp(credentials) {
  const res = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (res.token) {
    localStorage.setItem('kinetic_auth_token', res.token);
  }
  return res;
}

export async function apiSignIn(credentials) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (res.token) {
    localStorage.setItem('kinetic_auth_token', res.token);
  }
  return res;
}

export async function apiGetMe() {
  const res = await request('/auth/me');
  return res.user;
}
