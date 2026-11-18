CREATE TABLE IF NOT EXISTS devices (
  id varchar(64) PRIMARY KEY,
  last_seen timestamptz NOT NULL DEFAULT now(),
  latest jsonb
);
CREATE TABLE IF NOT EXISTS gas_readings (
  device_id varchar(64) NOT NULL REFERENCES devices(id),
  boot_id varchar(16) NOT NULL,
  sequence bigint NOT NULL CHECK (sequence BETWEEN 0 AND 4294967295),
  raw_adc integer NOT NULL CHECK (raw_adc BETWEEN 0 AND 4095),
  state text NOT NULL CHECK (state IN ('SAFE','WARNING','DANGER')),
  received_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (device_id, boot_id, sequence)
);
CREATE INDEX IF NOT EXISTS readings_device_time ON gas_readings(device_id, received_at DESC);
CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  device_id varchar(64) NOT NULL REFERENCES devices(id),
  received_at timestamptz NOT NULL,
  recovery boolean NOT NULL,
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS alerts_device_time ON alerts(device_id, received_at DESC);
