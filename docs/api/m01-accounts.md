# API contract — Member 01 (Accounts)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`.
Status: `planned` → `in progress` → `done`.

> **OTP note:** there is no SMS gateway in this project. The server generates the code, stores it hashed, and
> returns it as `devOtpCode` **only when `NODE_ENV` is not `production`**. The app shows it in a "Demo mode"
> banner. This is a documented deviation, not a security hole in production.

## Auth (`/api/auth`) — all public
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | Create a passenger account and issue a confirmation code | done |
| POST | `/api/auth/verify-otp` | public | Confirm the code; returns `{ token, user }` | done |
| POST | `/api/auth/resend-otp` | public | Issue a replacement code (60 s cooldown) | done |
| POST | `/api/auth/login` | public | Sign in with `identifier` (email or mobile) + `password` | done |

**POST /api/auth/register**
```json
{ "fullName": "Kavindu Jayawardane", "email": "k@example.com",
  "mobile": "0771234567", "password": "At least 8 chars", "hasAcceptedTerms": true }
```
→ `201` `{ userId, maskedMobile, expiresAt, resendAfterSeconds, devOtpCode? }` — **no token yet**.
Errors: `422` invalid fields · `409` email or mobile already registered (with per-field `errors`).

**POST /api/auth/verify-otp** `{ userId, otpCode }` → `200` `{ token, user }`.
Wrong code → `400` `"Invalid confirmation code. Remaining attempts: N"`. After 3 wrong guesses the code is burned.

## Users (`/api/users`) — signed-in user only
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/users/me` | any signed-in | Current user's profile | done |
| PATCH | `/api/users/me` | any signed-in | Update name, email, mobile, avatar | done |
| DELETE | `/api/users/me` | passenger, driver | Delete own account (admins are refused) | done |

## Admin accounts (`/api/admin/users`) — admin only
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/users?role=&status=&search=&page=&pageSize=` | admin | Paged account list | done |
| PATCH | `/api/admin/users/:userId/status` | admin | Block or unblock (cannot target yourself) | done |

## Admin drivers (`/api/admin/drivers`) — admin only
Drivers never self-register (PROJECT_PLAN.md deviation 4). Registering creates **both** the `User`
(role `driver`) and the `DriverProfile` holding licence + NIC; if the profile fails the user is rolled back.

| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/admin/drivers` | admin | Register a driver account + profile | done |
| GET | `/api/admin/drivers?search=&page=&pageSize=` | admin | Paged driver list (populated with the user) | done |
| GET | `/api/admin/drivers/:driverId` | admin | One driver | done |
| PATCH | `/api/admin/drivers/:driverId` | admin | Edit name, licence, NIC or account status | done |
| DELETE | `/api/admin/drivers/:driverId` | admin | Delete driver and their account | done |

## Validation rules enforced server-side
| Field | Rule |
|---|---|
| `email` | Valid address; unique across accounts |
| `mobile` | `07XXXXXXXX` or `+94XXXXXXXXX`; unique across accounts |
| `password` | At least 8 characters; stored as a bcrypt hash, never returned |
| `hasAcceptedTerms` | Must be `true` on register |
| `nic` | `123456789V` or 12 digits; unique across drivers |
| `licenseNumber` | Required; unique across drivers |
| `otpCode` | Exactly 6 digits; max 3 attempts; expires after 5 minutes |
