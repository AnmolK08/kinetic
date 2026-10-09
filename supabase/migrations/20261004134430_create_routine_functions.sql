/*
# Daily initialization + streak/analytics helper functions

## Functions

### initialize_day(user_id uuid, target_date date)
Idempotent daily initialization. For the given date:
1. Finds active routines owned by the user scheduled for that weekday.
2. Finds active tasks for those routines.
3. Inserts missing routine_task_logs with frozen snapshots.
4. Returns the day's full data: routines with their logs + computed stats.
Uses a SECURITY DEFINER function to do the upsert in one atomic call.

### get_day_view(user_id uuid, target_date date)
Returns the day's routines with logs and computed completion stats.

### get_streaks(user_id uuid, routine_id uuid NULL)
Calculates current and longest streak from historical logs.
A scheduled day counts toward streak if completion >= 100% (all tasks completed or skipped).
Unscheduled days never break the streak.

### get_calendar_data(user_id uuid, month text)
Returns per-date completion stats for a given month (YYYY-MM).

### get_analytics_overview(user_id uuid, range_days int)
Returns aggregate stats: total routines, tasks completed, completion %, streaks.

### get_routine_analytics(user_id uuid, routine_id uuid, range_days int)
Returns per-routine analytics.
*/

-- Helper: compute completion stats for a set of logs
CREATE OR REPLACE FUNCTION compute_stats(log_count int, completed_count int, skipped_count int)
RETURNS jsonb AS $$
DECLARE
  pending_count int;
  completion_percent int;
  is_complete boolean;
BEGIN
  pending_count := log_count - completed_count - skipped_count;
  IF log_count > 0 THEN
    completion_percent := ROUND((completed_count::numeric / log_count::numeric) * 100);
  ELSE
    completion_percent := 0;
  END IF;
  is_complete := (log_count > 0 AND pending_count = 0 AND completed_count = log_count);
  RETURN jsonb_build_object(
    'total', log_count,
    'completed', completed_count,
    'skipped', skipped_count,
    'pending', pending_count,
    'completion_percent', completion_percent,
    'is_complete', is_complete
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Initialize day: create missing logs idempotently
CREATE OR REPLACE FUNCTION initialize_day(p_user_id uuid, p_date date)
RETURNS jsonb AS $$
DECLARE
  v_weekday int;
  v_routine record;
  v_task record;
  v_existing_uuid uuid;
  v_routines_json jsonb := '[]'::jsonb;
  v_routine_json jsonb;
  v_logs_json jsonb;
  v_stats jsonb;
  v_total_all int := 0;
  v_completed_all int := 0;
  v_skipped_all int := 0;
  v_pending_all int := 0;
  v_pct_all int;
  v_overall_json jsonb;
BEGIN
  -- Monday=0 in our days_of_week array; extract(date 'dow') returns Sunday=0..Saturday=6
  -- Convert: Sunday(0)→6, Monday(1)→0, ..., Saturday(6)→5
  v_weekday := (EXTRACT(DOW FROM p_date)::int + 6) % 7;

  FOR v_routine IN
    SELECT id, name, days_of_week
    FROM routines
    WHERE user_id = p_user_id AND is_active = true
      AND days_of_week @> ARRAY[v_weekday]::int2[]
    ORDER BY created_at
  LOOP
    v_logs_json := '[]'::jsonb;

    FOR v_task IN
      SELECT id, title, description, position, estimated_minutes
      FROM routine_tasks
      WHERE routine_id = v_routine.id AND is_active = true
      ORDER BY position
    LOOP
      SELECT id INTO v_existing_uuid
        FROM routine_task_logs
        WHERE routine_task_id = v_task.id AND date = p_date;

      IF v_existing_uuid IS NULL THEN
        INSERT INTO routine_task_logs (routine_id, routine_task_id, user_id, date, task_title_snapshot, task_description_snapshot, position_snapshot, estimated_minutes_snapshot, status)
        VALUES (v_routine.id, v_task.id, p_user_id, p_date, v_task.title, v_task.description, v_task.position, v_task.estimated_minutes, 'PENDING')
        RETURNING id INTO v_existing_uuid;
      END IF;
    END LOOP;

    -- Build routine json with logs and stats
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', l.id,
      'routine_id', l.routine_id,
      'routine_task_id', l.routine_task_id,
      'title', l.task_title_snapshot,
      'description', l.task_description_snapshot,
      'position', l.position_snapshot,
      'estimated_minutes', l.estimated_minutes_snapshot,
      'status', l.status,
      'completed_at', l.completed_at
    ) ORDER BY l.position_snapshot), '[]'::jsonb) INTO v_logs_json
    FROM routine_task_logs l
    WHERE l.routine_id = v_routine.id AND l.date = p_date;

    SELECT compute_stats(
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_routine.id AND date = p_date),
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_routine.id AND date = p_date AND status = 'COMPLETED'),
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_routine.id AND date = p_date AND status = 'SKIPPED')
    ) INTO v_stats;

    v_routine_json := jsonb_build_object(
      'id', v_routine.id,
      'name', v_routine.name,
      'days_of_week', v_routine.days_of_week,
      'is_scheduled', true,
      'logs', v_logs_json,
      'stats', v_stats
    );

    v_routines_json := v_routines_json || jsonb_build_array(v_routine_json);

    v_total_all := v_total_all + (v_stats->>'total')::int;
    v_completed_all := v_completed_all + (v_stats->>'completed')::int;
    v_skipped_all := v_skipped_all + (v_stats->>'skipped')::int;
    v_pending_all := v_pending_all + (v_stats->>'pending')::int;
  END LOOP;

  IF v_total_all > 0 THEN
    v_pct_all := ROUND((v_completed_all::numeric / v_total_all::numeric) * 100);
  ELSE
    v_pct_all := 0;
  END IF;

  v_overall_json := jsonb_build_object(
    'total', v_total_all,
    'completed', v_completed_all,
    'skipped', v_skipped_all,
    'pending', v_pending_all,
    'completion_percent', v_pct_all,
    'is_complete', (v_total_all > 0 AND v_pending_all = 0 AND v_completed_all = v_total_all)
  );

  RETURN jsonb_build_object(
    'date', to_char(p_date, 'YYYY-MM-DD'),
    'weekday', v_weekday,
    'routines', v_routines_json,
    'overall', v_overall_json
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get history for a specific date (read-only, no init)
CREATE OR REPLACE FUNCTION get_day_history(p_user_id uuid, p_date date)
RETURNS jsonb AS $$
DECLARE
  v_weekday int;
  v_routines_json jsonb := '[]'::jsonb;
  v_routine_json jsonb;
  v_logs_json jsonb;
  v_stats jsonb;
  v_total_all int := 0;
  v_completed_all int := 0;
  v_skipped_all int := 0;
  v_pending_all int := 0;
  v_pct_all int;
  v_overall_json jsonb;
  v_r record;
BEGIN
  v_weekday := (EXTRACT(DOW FROM p_date)::int + 6) % 7;

  FOR v_r IN
    SELECT r.id, r.name, r.days_of_week,
      EXISTS(SELECT 1 FROM routine_task_logs WHERE routine_id = r.id AND date = p_date) AS has_logs
    FROM routines r
    WHERE r.user_id = p_user_id
      AND (
        (r.days_of_week @> ARRAY[v_weekday]::int2[] AND r.is_active = true)
        OR EXISTS(SELECT 1 FROM routine_task_logs WHERE routine_id = r.id AND date = p_date)
      )
    ORDER BY r.created_at
  LOOP
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', l.id,
      'routine_id', l.routine_id,
      'routine_task_id', l.routine_task_id,
      'title', l.task_title_snapshot,
      'description', l.task_description_snapshot,
      'position', l.position_snapshot,
      'estimated_minutes', l.estimated_minutes_snapshot,
      'status', l.status,
      'completed_at', l.completed_at
    ) ORDER BY l.position_snapshot), '[]'::jsonb) INTO v_logs_json
    FROM routine_task_logs l
    WHERE l.routine_id = v_r.id AND l.date = p_date;

    SELECT compute_stats(
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_r.id AND date = p_date),
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_r.id AND date = p_date AND status = 'COMPLETED'),
      (SELECT count(*)::int FROM routine_task_logs WHERE routine_id = v_r.id AND date = p_date AND status = 'SKIPPED')
    ) INTO v_stats;

    v_routine_json := jsonb_build_object(
      'id', v_r.id,
      'name', v_r.name,
      'days_of_week', v_r.days_of_week,
      'is_scheduled', v_r.days_of_week @> ARRAY[v_weekday]::int2[],
      'logs', v_logs_json,
      'stats', v_stats
    );

    v_routines_json := v_routines_json || jsonb_build_array(v_routine_json);
    v_total_all := v_total_all + (v_stats->>'total')::int;
    v_completed_all := v_completed_all + (v_stats->>'completed')::int;
    v_skipped_all := v_skipped_all + (v_stats->>'skipped')::int;
    v_pending_all := v_pending_all + (v_stats->>'pending')::int;
  END LOOP;

  IF v_total_all > 0 THEN
    v_pct_all := ROUND((v_completed_all::numeric / v_total_all::numeric) * 100);
  ELSE
    v_pct_all := 0;
  END IF;

  v_overall_json := jsonb_build_object(
    'total', v_total_all,
    'completed', v_completed_all,
    'skipped', v_skipped_all,
    'pending', v_pending_all,
    'completion_percent', v_pct_all,
    'is_complete', (v_total_all > 0 AND v_pending_all = 0 AND v_completed_all = v_total_all)
  );

  RETURN jsonb_build_object(
    'date', to_char(p_date, 'YYYY-MM-DD'),
    'routines', v_routines_json,
    'overall', v_overall_json
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Streak calculation: walks back from today through scheduled days only
CREATE OR REPLACE FUNCTION get_streaks(p_user_id uuid, p_routine_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_current_streak int := 0;
  v_longest_streak int := 0;
  v_temp_streak int := 0;
  v_d date := CURRENT_DATE;
  v_weekday int;
  v_is_scheduled boolean;
  v_total int;
  v_completed int;
  v_is_complete boolean;
  v_has_logs boolean;
  v_earliest_date date;
  v_routine_filter text;
BEGIN
  -- Find earliest log date to bound the walk-back
  IF p_routine_id IS NOT NULL THEN
    SELECT MIN(date) INTO v_earliest_date
      FROM routine_task_logs WHERE user_id = p_user_id AND routine_id = p_routine_id;
  ELSE
    SELECT MIN(date) INTO v_earliest_date
      FROM routine_task_logs WHERE user_id = p_user_id;
  END IF;

  IF v_earliest_date IS NULL THEN
    RETURN jsonb_build_object('current', 0, 'longest', 0);
  END IF;

  -- Walk backward from today
  WHILE v_d >= v_earliest_date LOOP
    v_weekday := (EXTRACT(DOW FROM v_d)::int + 6) % 7;

    -- Is this day scheduled for any of the user's active routines?
    IF p_routine_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM routines
        WHERE id = p_routine_id AND is_active = true AND days_of_week @> ARRAY[v_weekday]::int2[]
      ) INTO v_is_scheduled;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM routines
        WHERE user_id = p_user_id AND is_active = true AND days_of_week @> ARRAY[v_weekday]::int2[]
      ) INTO v_is_scheduled;
    END IF;

    -- Get completion stats for this date
    IF p_routine_id IS NOT NULL THEN
      SELECT count(*)::int, count(*) FILTER (WHERE status = 'COMPLETED')::int
        INTO v_total, v_completed
        FROM routine_task_logs WHERE user_id = p_user_id AND routine_id = p_routine_id AND date = v_d;
    ELSE
      SELECT count(*)::int, count(*) FILTER (WHERE status = 'COMPLETED')::int
        INTO v_total, v_completed
        FROM routine_task_logs WHERE user_id = p_user_id AND date = v_d;
    END IF;

    v_has_logs := v_total > 0;
    v_is_complete := (v_total > 0 AND v_completed = v_total);

    IF v_is_scheduled THEN
      IF v_is_complete THEN
        v_temp_streak := v_temp_streak + 1;
        IF v_d = CURRENT_DATE OR v_current_streak = 0 OR v_current_streak = v_temp_streak - 1 THEN
          v_current_streak := v_temp_streak;
        END IF;
        IF v_temp_streak > v_longest_streak THEN
          v_longest_streak := v_temp_streak;
        END IF;
      ELSE
        -- Scheduled but not complete: streak breaks
        -- If this is today and not complete, don't break yet (user might still complete)
        IF v_d = CURRENT_DATE AND v_has_logs AND v_completed > 0 THEN
          -- Today in progress, don't break current streak
          IF v_temp_streak > v_longest_streak THEN
            v_longest_streak := v_temp_streak;
          END IF;
        ELSE
          v_temp_streak := 0;
          -- For current streak: if we've started counting and hit an incomplete scheduled day, stop
          IF v_current_streak > 0 AND v_d < CURRENT_DATE THEN
            -- Already captured current streak, just continue for longest
          END IF;
        END IF;
      END IF;
    END IF;

    v_d := v_d - 1;
  END LOOP;

  IF v_temp_streak > v_longest_streak THEN
    v_longest_streak := v_temp_streak;
  END IF;

  RETURN jsonb_build_object('current', v_current_streak, 'longest', v_longest_streak);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calendar data: per-date stats for a month
CREATE OR REPLACE FUNCTION get_calendar_data(p_user_id uuid, p_month text)
RETURNS jsonb AS $$
DECLARE
  v_month_start date := (p_month || '-01')::date;
  v_month_end date := date_trunc('month', v_month_start)::date + interval '1 month' - interval '1 day';
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', to_char(d.date, 'YYYY-MM-DD'),
    'total', d.total,
    'completed', d.completed,
    'skipped', d.skipped,
    'percent', CASE WHEN d.total > 0 THEN ROUND((d.completed::numeric / d.total::numeric) * 100) ELSE 0 END
  ) ORDER BY d.date), '[]'::jsonb) INTO v_result
  FROM (
    SELECT
      l.date,
      count(*)::int AS total,
      count(*) FILTER (WHERE l.status = 'COMPLETED')::int AS completed,
      count(*) FILTER (WHERE l.status = 'SKIPPED')::int AS skipped
    FROM routine_task_logs l
    WHERE l.user_id = p_user_id
      AND l.date >= v_month_start
      AND l.date <= v_month_end
    GROUP BY l.date
  ) d;

  RETURN jsonb_build_object('days', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics overview
CREATE OR REPLACE FUNCTION get_analytics_overview(p_user_id uuid, p_range_days int DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  v_start_date date := CURRENT_DATE - p_range_days;
  v_total_routines int;
  v_total_logs int;
  v_completed_logs int;
  v_skipped_logs int;
  v_pending_logs int;
  v_pct int;
  v_streaks jsonb;
BEGIN
  SELECT count(*)::int INTO v_total_routines
    FROM routines WHERE user_id = p_user_id AND is_active = true;

  SELECT count(*)::int, count(*) FILTER (WHERE status = 'COMPLETED')::int,
         count(*) FILTER (WHERE status = 'SKIPPED')::int, count(*) FILTER (WHERE status = 'PENDING')::int
    INTO v_total_logs, v_completed_logs, v_skipped_logs, v_pending_logs
    FROM routine_task_logs
    WHERE user_id = p_user_id AND date >= v_start_date;

  IF v_total_logs > 0 THEN
    v_pct := ROUND((v_completed_logs::numeric / v_total_logs::numeric) * 100);
  ELSE
    v_pct := 0;
  END IF;

  SELECT get_streaks(p_user_id, NULL) INTO v_streaks;

  RETURN jsonb_build_object(
    'total_routines', v_total_routines,
    'total_tasks_completed', v_completed_logs,
    'total_scheduled_tasks', v_total_logs,
    'completion_percent', v_pct,
    'current_streak', v_streaks->>'current',
    'longest_streak', v_streaks->>'longest',
    'range_days', p_range_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Per-routine analytics
CREATE OR REPLACE FUNCTION get_routine_analytics(p_user_id uuid, p_routine_id uuid, p_range_days int DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  v_routine record;
  v_total_logs int;
  v_completed_logs int;
  v_pct int;
  v_streaks jsonb;
  v_missed_days int;
BEGIN
  SELECT id, name, days_of_week INTO v_routine
    FROM routines WHERE id = p_routine_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Routine not found');
  END IF;

  SELECT count(*)::int, count(*) FILTER (WHERE status = 'COMPLETED')::int
    INTO v_total_logs, v_completed_logs
    FROM routine_task_logs
    WHERE user_id = p_user_id AND routine_id = p_routine_id AND date >= CURRENT_DATE - p_range_days;

  IF v_total_logs > 0 THEN
    v_pct := ROUND((v_completed_logs::numeric / v_total_logs::numeric) * 100);
  ELSE
    v_pct := 0;
  END IF;

  SELECT get_streaks(p_user_id, p_routine_id) INTO v_streaks;

  -- Count missed scheduled days (scheduled days with logs but not fully completed)
  SELECT count(DISTINCT l.date)::int INTO v_missed_days
    FROM routine_task_logs l
    WHERE l.user_id = p_user_id AND l.routine_id = p_routine_id
      AND l.date >= CURRENT_DATE - p_range_days
      AND l.date < CURRENT_DATE
    GROUP BY l.date
    HAVING count(*) FILTER (WHERE l.status = 'COMPLETED') < count(*);

  IF v_missed_days IS NULL THEN v_missed_days := 0; END IF;

  RETURN jsonb_build_object(
    'id', v_routine.id,
    'name', v_routine.name,
    'completion_rate', v_pct,
    'completed_tasks', v_completed_logs,
    'total_tasks', v_total_logs,
    'current_streak', v_streaks->>'current',
    'longest_streak', v_streaks->>'longest',
    'missed_days', v_missed_days,
    'range_days', p_range_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION initialize_day(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_day_history(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_streaks(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_data(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_overview(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_routine_analytics(uuid, uuid, int) TO authenticated;
