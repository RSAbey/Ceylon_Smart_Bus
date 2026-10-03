# API contract — Member 01 (Accounts)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Auth (`/api/auth`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/auth/login` | public | Log in with `identifier` (email or mobile) + `password`; returns `{ token, user }` | done (foundation) |

## Users (`/api/users`, `/api/admin/users`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/users/me` | any signed-in | Current user's profile | done (foundation) |

## Drivers (`/api/admin/drivers`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
