# Infrastructure

PostgreSQL 16 is the planned persistent store. Apply versioned SQL migrations with `cd backend && npm run migrate` after setting DATABASE_URL in ignored `.env`. `MIGRATE_ON_START=true` is a development convenience; explicit migrations are preferred for deployment. Do not use the project database for tests.

`python3 tests/run-postgres.py` creates a uniquely named, throwaway PostgreSQL container with a generated password and random localhost port, runs real storage integration tests, and removes the container in `finally`. It requires a running Docker engine and pulls `postgres:16-alpine` if missing. No project volumes are modified.

## Integrated development stack

Run `python3 scripts/configure-local.py` then `docker compose --project-directory infrastructure up --build -d` from repository root. Open http://localhost:8080. `down` preserves the project data volume; the isolated test runner uses separate throwaway containers. Full isolated image build/startup, real PostgreSQL/broker/backend, synthetic MQTT persistence and dashboard HTTP checks passed on 2026-11-19. The frontend builder uses Debian after the Alpine native bundler failed. See docs/integration.md and docs/final-acceptance.md.
