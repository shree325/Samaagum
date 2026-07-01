INSERT INTO roles (key, level, phase, reserved, baseline_capabilities) VALUES
('super_admin', 'platform', 'MVP-0', true, '[]'::jsonb),
('org_admin', 'org', 'MVP-0', true, '[]'::jsonb),
('community_admin', 'community', 'MVP-0', true, '[]'::jsonb),
('group_owner', 'group', 'MVP', false, '["group.manage","group.settings"]'::jsonb),
('group_admin', 'group', 'MVP', false, '["group.manage"]'::jsonb),
('group_moderator', 'group', 'MVP', false, '["group.view","group.moderate"]'::jsonb),
('group_member', 'group', 'MVP', false, '["group.view"]'::jsonb),
('moderator', 'event', 'MVP-0', true, '[]'::jsonb),
('member', 'participation', 'MVP-0', true, '[]'::jsonb)
ON CONFLICT (key) DO UPDATE
SET level = EXCLUDED.level, phase = EXCLUDED.phase, reserved = EXCLUDED.reserved, baseline_capabilities = EXCLUDED.baseline_capabilities;