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
| POST | `/api/auth/forgot-password` | public | Email a 6-digit reset code that lasts 5 minutes. Body `{ email }`. The answer is identical whether or not the address has an account, so it cannot be used to find out who is registered; it carries `expiresAt` for the countdown, and outside production `devOtpCode` as well. | done |
| POST | `/api/auth/reset-password` | public | Finish a reset. Body `{ email, otpCode, newPassword }`. Wrong codes count towards the same 3-attempt limit as registration; the new password has to pass all three password rules. | done |
| POST | `/api/auth/verify-otp` | public | Confirm the code; returns `{ token, user }` | done |
| POST | `/api/auth/resend-otp` | public | Issue a replacement code (60 s cooldown) | done |
| POST | `/api/auth/login` | public | Sign in with `identifier` (email or mobile) + `password` | done |


**The three password rules.** Every endpoint that sets a password — register, reset and change —
applies the same three checks: at least 8 characters, at least one capital letter and at least one
symbol. The app draws them as a three-segment strength meter, but the server is what decides.

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
| PATCH | `/api/users/me/password` | any signed-in | Change your own password. Body `{ currentPassword, newPassword }`. The current password is checked against the stored hash; a wrong one returns **422 with a field error**, not 401, so a typo does not sign the caller out. Reusing the same password returns 409. | done |
| DELETE | `/api/users/me` | passenger, driver | Delete own account for good. Body `{ password }`, checked against the stored hash (422 with a field error when wrong). Everything the account owns goes with it — tickets and their payments, seat bookings and verifications, the wallet and its statement, saved routes, alert subscriptions, recent searches, notifications, inquiries and their replies, and for a driver the profile and delay reports, with their bus returned to the pool. A driver on an ongoing trip is refused with 409. Admins are refused. | done |

## Admin accounts (`/api/admin/users`) — admin only
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/users?role=&status=&search=&page=&pageSize=` | admin | Paged account list | done |
| GET | `/api/admin/users/me/activity` | admin | What the signed-in administrator has done: notifications they published, replies they wrote, and inquiries assigned to them that are not closed. | done |
| GET | `/api/admin/users/passengers?status=&search=` | admin | The passenger roster for the Passengers page: each account with its ticket count, active tickets, last ticket, wallet balance and open inquiries, plus the counts above the table (total, active, blocked, new in the last 7 days). Search matches name, email or mobile. | done |
| GET | `/api/admin/users/passengers/:userId` | admin | One passenger's record: the account, fares paid, wallet balance, saved routes, their five latest tickets and any inquiry still open. 404 for an account that is not a passenger. | done |
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
