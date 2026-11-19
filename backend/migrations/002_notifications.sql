CREATE TABLE notification_state (
  device_id varchar(64) PRIMARY KEY REFERENCES devices(id),
  policy jsonb NOT NULL DEFAULT '{"lastSent":{}}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notification_outbox (
  ordinal bigserial PRIMARY KEY,
  alert_id text NOT NULL UNIQUE REFERENCES alerts(id),
  device_id varchar(64) NOT NULL REFERENCES devices(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','suppressed','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX notification_due ON notification_outbox(next_attempt_at, ordinal) WHERE status='pending';
CREATE INDEX notification_device_pending ON notification_outbox(device_id, ordinal) WHERE status='pending';
