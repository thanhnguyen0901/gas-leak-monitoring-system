# Repository working instructions

## Required reading before work

Before modifying code, always read these files in order:

1. `AGENTS.md`
2. `requirements.md`
3. `plan.md`
4. `audit.md`

## Source of truth

- `requirements.md` defines WHAT the system must do.
- `plan.md` defines implementation phases and exit criteria.
- `audit.md` records WHAT has actually been completed and verified.
- Code and tests are the implementation truth.

If documentation conflicts, document the conflict and resolve it before making broad changes. Do not silently guess.

## Work scope

Work on ONE requested phase or task at a time. Do not implement future phases unless explicitly requested. Do not introduce unnecessary frameworks or technologies. The initialization task creates documentation and placeholders only; it does not scaffold applications or implement hardware logic.

## Safety architecture rule

Local safety functionality must remain independent from networking. Gas classification, buzzer, LEDs, and fan control must not require Wi-Fi, MQTT, backend, database, dashboard, or Internet availability. Connectivity retries must run separately without blocking local safety behavior.

## Wokwi rule

Prefer version-controlled circuit definitions at `firmware/wokwi/diagram.json` when simulation implementation begins. Do not create a circuit definition merely to fill this initialization placeholder. Label simulated analog values and thresholds clearly; raw ADC values are not calibrated ppm.

## Verification

After every implementation task:

1. Build/compile.
2. Run applicable tests.
3. Verify simulation when applicable.
4. Report what was verified, including limitations and checks not run.
5. Update `plan.md` only for tasks actually completed.
6. Append a dated entry to `audit.md`; never rewrite historical entries.
7. Save useful evidence under `docs/evidence/<phase>/` when relevant.

Never claim PASS without verification. For documentation-only tasks, verify file completeness, consistency, and scope; compilation and runtime tests are not applicable.

## Git policy

Do not create commits unless explicitly requested. Do not push unless explicitly requested.

Suggested Conventional Commit prefixes: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.

When a phase is completed, recommend an appropriate commit message.

## Secrets

Never hard-code or commit Wi-Fi credentials, MQTT username/password, Telegram bot tokens, PostgreSQL passwords, or API secrets. Use configuration templates such as `.env.example` when the relevant phases are implemented. Templates must contain placeholders only.
