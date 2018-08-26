ALTER TABLE rebates ADD COLUMN dispatched_at timestamptz default CURRENT_DATE;
