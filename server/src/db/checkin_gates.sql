DROP TABLE IF EXISTS checkin_gates CASCADE;

CREATE TABLE checkin_gates (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,

    name                      VARCHAR(255) NOT NULL,
    gate_code                 VARCHAR(50)  NOT NULL,
    gate_type                 VARCHAR(50)  DEFAULT 'entry',
    location_note             TEXT,

    device_binding_id         UUID,
    is_active                 BOOLEAN      DEFAULT TRUE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_checkin_gates_tenant_code UNIQUE (tenant_id, event_id, gate_code)
);

-- Row-Level Security
ALTER TABLE checkin_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON checkin_gates
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_checkin_gates_tenant ON checkin_gates (tenant_id);
CREATE INDEX idx_checkin_gates_event  ON checkin_gates (event_id);
