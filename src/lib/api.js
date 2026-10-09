import { supabase } from './supabase';
import { browserTodayIso, getTimezone } from './dates';

// ---- Routines ----

export async function fetchRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('id, name, description, days_of_week, is_active, created_at')
    .order('created_at');
  if (error) throw error;

  const routineIds = (data ?? []).map((r) => r.id);
  if (routineIds.length === 0) return [];

  const { data: tasks } = await supabase
    .from('routine_tasks')
    .select('routine_id, estimated_minutes, is_active')
    .in('routine_id', routineIds);

  const taskMap = new Map();
  for (const t of tasks ?? []) {
    if (!t.is_active) continue;
    const cur = taskMap.get(t.routine_id) ?? { count: 0, minutes: 0 };
    cur.count += 1;
    cur.minutes += t.estimated_minutes ?? 0;
    taskMap.set(t.routine_id, cur);
  }

  return (data ?? []).map((r) => {
    const info = taskMap.get(r.id) ?? { count: 0, minutes: 0 };
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      days_of_week: Array.from(r.days_of_week),
      is_active: r.is_active,
      task_count: info.count,
      total_minutes: info.minutes,
      created_at: r.created_at,
    };
  });
}

export async function fetchRoutine(id) {
  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .select('id, name, description, days_of_week, is_active, created_at')
    .eq('id', id)
    .single();
  if (rErr) throw rErr;

  const { data: tasks, error: tErr } = await supabase
    .from('routine_tasks')
    .select('id, routine_id, title, description, position, estimated_minutes, is_active, created_at')
    .eq('routine_id', id)
    .order('position');
  if (tErr) throw tErr;

  return {
    ...routine,
    days_of_week: Array.from(routine.days_of_week),
    tasks: tasks ?? [],
  };
}

export async function createRoutine(input) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('routines')
    .insert({
      user_id: user.user.id,
      name: input.name,
      description: input.description ?? null,
      days_of_week: input.days_of_week,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(id, patch) {
  const { data, error } = await supabase
    .from('routines')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoutine(id) {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
}

export async function createTask(routineId, input) {
  const { data: existing } = await supabase
    .from('routine_tasks')
    .select('position')
    .eq('routine_id', routineId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('routine_tasks')
    .insert({
      routine_id: routineId,
      title: input.title,
      description: input.description ?? null,
      estimated_minutes: input.estimated_minutes ?? null,
      position: nextPos,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, patch) {
  const { data, error } = await supabase
    .from('routine_tasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase.from('routine_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderTasks(routineId, taskIds) {
  for (let i = 0; i < taskIds.length; i++) {
    const { error } = await supabase
      .from('routine_tasks')
      .update({ position: i })
      .eq('id', taskIds[i])
      .eq('routine_id', routineId);
    if (error) throw error;
  }
}

export async function fetchToday(customDate) {
  const date = customDate ?? browserTodayIso();
  const tz = getTimezone();
  const { data, error } = await supabase.rpc('get_day_view', {
    target_date: date,
    target_timezone: tz,
  });
  if (error) throw error;
  return data;
}

export async function fetchHistory(date) {
  const tz = getTimezone();
  const { data, error } = await supabase.rpc('get_history_view', {
    target_date: date,
    target_timezone: tz,
  });
  if (error) throw error;
  return data;
}

export async function setLogStatus(routineTaskId, date, status) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: task, error: tErr } = await supabase
    .from('routine_tasks')
    .select('routine_id')
    .eq('id', routineTaskId)
    .single();
  if (tErr) throw tErr;

  const { data, error } = await supabase
    .from('daily_task_logs')
    .upsert(
      {
        user_id: user.user.id,
        routine_id: task.routine_id,
        routine_task_id: routineTaskId,
        date,
        status,
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,routine_task_id,date' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCalendar(month) {
  const tz = getTimezone();
  const { data, error } = await supabase.rpc('get_month_completion', {
    target_month: month,
    target_timezone: tz,
  });
  if (error) throw error;
  return data;
}

export async function fetchOverviewAnalytics(days = 30) {
  const tz = getTimezone();
  const { data, error } = await supabase.rpc('get_overview_analytics', {
    days_back: days,
    target_timezone: tz,
  });
  if (error) throw error;
  return data;
}

export async function fetchRoutineAnalytics(routineId, days = 30) {
  const tz = getTimezone();
  const { data, error } = await supabase.rpc('get_routine_analytics', {
    target_routine_id: routineId,
    days_back: days,
    target_timezone: tz,
  });
  if (error) throw error;
  return data;
}
