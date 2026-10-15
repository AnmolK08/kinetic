/*
# Routine & Habit Tracker — Core Schema

## Overview
Creates the 4-table routine architecture: routines, routine_tasks, routine_task_logs.
Supports reusable routines with day-of-week schedules, historical snapshot preservation,
and idempotent daily initialization.

## Tables

### routines
- id (uuid PK)
- user_id (uuid, owner, defaults to auth.uid())
- name (text)
- description (text, nullable)
- days_of_week (int2[], stores 0-6 where 0=Monday)
- is_active (boolean, default true)
- created_at, updated_at (timestamptz)

### routine_tasks
- id (uuid PK)
- routine_id (uuid FK → routines)
- title (text)
- description (text, nullable)
- position (int, for ordering)
- estimated_minutes (int, nullable)
- is_active (boolean, default true)
- created_at, updated_at (timestamptz)

### routine_task_logs
- id (uuid PK)
- routine_id (uuid FK → routines)
- routine_task_id (uuid FK → routine_tasks)
- user_id (uuid, owner)
- date (date, the execution date)
- task_title_snapshot (text, frozen at init time)
- task_description_snapshot (text, nullable, frozen)
- position_snapshot (int, frozen)
- estimated_minutes_snapshot (int, nullable, frozen)
- status (text: PENDING | COMPLETED | SKIPPED)
- completed_at (timestamptz, nullable)
- created_at, updated_at (timestamptz)
- UNIQUE constraint on (routine_task_id, date) for idempotency

## Indexes
- routine_tasks: routine_id, position
- routine_task_logs: user_id+date, routine_id+date, routine_task_id+date, status

## Security
- RLS enabled on all tables
- Owner-scoped policies (TO authenticated) using auth.uid() = user_id
- Child tables scoped through parent ownership check
*/

-- Routines
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  days_of_week int2[] NOT NULL DEFAULT ARRAY[0,1,2,3,4]::int2[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_routines" ON routines;
CREATE POLICY "select_own_routines" ON routines FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_routines" ON routines;
CREATE POLICY "insert_own_routines" ON routines FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_routines" ON routines;
CREATE POLICY "update_own_routines" ON routines FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_routines" ON routines;
CREATE POLICY "delete_own_routines" ON routines FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Routine Tasks
CREATE TABLE IF NOT EXISTS routine_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position int NOT NULL DEFAULT 0,
  estimated_minutes int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routine_tasks_routine_id ON routine_tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_position ON routine_tasks(routine_id, position);

ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON routine_tasks;
CREATE POLICY "select_own_tasks" ON routine_tasks FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_tasks" ON routine_tasks;
CREATE POLICY "insert_own_tasks" ON routine_tasks FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid())
);

DROP POLICY IF EXISTS "update_own_tasks" ON routine_tasks;
CREATE POLICY "update_own_tasks" ON routine_tasks FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid())
);

DROP POLICY IF EXISTS "delete_own_tasks" ON routine_tasks;
CREATE POLICY "delete_own_tasks" ON routine_tasks FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_tasks.routine_id AND routines.user_id = auth.uid())
);

-- Routine Task Logs (the critical historical table)
CREATE TABLE IF NOT EXISTS routine_task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  routine_task_id uuid NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  task_title_snapshot text NOT NULL,
  task_description_snapshot text,
  position_snapshot int NOT NULL DEFAULT 0,
  estimated_minutes_snapshot int,
  status text NOT NULL DEFAULT 'PENDING',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(routine_task_id, date)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON routine_task_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_routine_date ON routine_task_logs(routine_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_task_date ON routine_task_logs(routine_task_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_status ON routine_task_logs(status);

ALTER TABLE routine_task_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_logs" ON routine_task_logs;
CREATE POLICY "select_own_logs" ON routine_task_logs FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_logs" ON routine_task_logs;
CREATE POLICY "insert_own_logs" ON routine_task_logs FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_logs" ON routine_task_logs;
CREATE POLICY "update_own_logs" ON routine_task_logs FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_logs" ON routine_task_logs;
CREATE POLICY "delete_own_logs" ON routine_task_logs FOR DELETE
TO authenticated USING (auth.uid() = user_id);
