INSERT INTO roles (key, name, level, phase, is_reserved, description) VALUES
('super_admin', 'Super Admin', 100, NULL, true, 'System-wide super administrator'),
('org_admin', 'Organization Admin', 80, NULL, true, 'Administrator for an organization'),
('community_admin', 'Community Admin', 70, NULL, true, 'Administrator for a community'),
('group_admin', 'Group Admin', 60, NULL, true, 'Administrator for a group'),
('moderator', 'Moderator', 40, NULL, true, 'Moderator for a community or group'),
('member', 'Member', 10, NULL, true, 'Standard member')
ON CONFLICT (key) DO UPDATE 
SET name = EXCLUDED.name, level = EXCLUDED.level, description = EXCLUDED.description;


INSERT INTO roles (
    name,
    is_reserved,
    description
)
VALUES
('Super Admin', true, 'System-wide super administrator'),
('Organization Admin', true, 'Administrator for an organization'),
('Community Admin', true, 'Administrator for a community'),
('Group Admin', true, 'Administrator for a group'),
('Moderator', true, 'Moderator for a community or group'),
('Member', true, 'Standard member')
ON CONFLICT (name)
DO UPDATE SET
    description = EXCLUDED.description,
    is_reserved = EXCLUDED.is_reserved,
    updated_at = NOW();