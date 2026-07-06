-- Defensive one-time fix: remap any event_team_assignments still pointing at the
-- old hardcoded event-role keys (event_host/event_cohost/event_scanner/event_member)
-- to their seeded RBAC equivalents. These old keys were never seeded, so this is a
-- no-op unless hand-inserted/legacy data exists.
UPDATE event_team_assignments eta
SET role_id = new_r.id
FROM roles old_r, roles new_r
WHERE eta.role_id = old_r.id
  AND old_r.key = ANY(ARRAY['event_host','event_cohost','event_scanner','event_member'])
  AND new_r.key = CASE old_r.key
      WHEN 'event_host' THEN 'event_owner'
      WHEN 'event_cohost' THEN 'co_host'
      WHEN 'event_scanner' THEN 'ticket_scanner'
      WHEN 'event_member' THEN 'member'
  END;
