# Infrastructure

PostgreSQL 16 is the planned persistent store. Apply versioned SQL migrations with `cd backend && npm run migrate` after setting DATABASE_URL in ignored `.env`. `MIGRATE_ON_START=true` is a development convenience; explicit migrations are preferred for deployment. Do not use the project database for tests.

`python3 tests/run-postgres.py` creates a uniquely named, throwaway PostgreSQL container with a generated password and random localhost port, runs real storage integration tests, and removes the container in `finally`. It requires a running Docker engine and pulls `postgres:16-alpine` if missing. No project volumes are modified.
