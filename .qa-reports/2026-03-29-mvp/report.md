# QA Report: King Move MVP
**Date**: 2026-03-29
**Status**: PARTIALLY_PASSED

## Test Steps
1. **04-landing-full** — landing page loaded — `http://localhost:3000/`
2. **05-after-register** — after register, url: http://localhost:3000/register — `http://localhost:3000/register`
3. **06-after-login** — after login, url: http://localhost:3000/register — `http://localhost:3000/register`
4. **BLOCKED** — Login did not complete — email confirmation likely required — `http://localhost:3000/register`

## Screenshots
- `screenshots/04-landing-full.png`
- `screenshots/05-after-register.png`
- `screenshots/06-after-login.png`

## Flows Tested
- Landing page
- Register flow
- Login flow
- /play — wallet real, demo credits, cash mode
- /social — leaderboard real
- /settings — profile + billing
- /puzzles — ELO real
