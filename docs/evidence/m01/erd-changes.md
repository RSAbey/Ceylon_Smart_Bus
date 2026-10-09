# Data model changes — Member 01

`docs/ERD_AND_RELATIONAL.md` has been updated with the change below, and **the ERD diagram in the
report must be redrawn to match**. Member 03's own changes are listed separately in
`docs/evidence/m03/erd-changes.md`; both sets have to reach the diagram before it is submitted.

## 1. Two columns on `USER` for the optional app lock

| Table | Column | Type | Notes |
|---|---|---|---|
| `USER` | `appPinHash` | string | bcrypt hash of the app lock PIN. **Null until the user turns the lock on**, which is how "has no PIN" is stored. Never selected by default and never returned by the API. |
| `USER` | `appPinSetAt` | date | When the PIN was created or last changed. Null when there is no PIN. |

No new table, no new relationship, no new enum.

**Why columns on `USER` and not a table of their own.** The app lock is one optional PIN per account,
which is a 1:1 with `USER` and no more than `passwordHash` already is. A separate `APP_PIN` table
would add a join and a second place for "does this account have a lock?" to disagree with itself.
`appPinHash` sits beside `passwordHash` for the same reason and with the same protections: declared
`select: false` so a stray query cannot load it, and listed in the model's `toJSON` exclusions so it
cannot leave the server even when a service does ask for it.

**Why a hash and not something readable.** The PIN is checked, changed and removed, but it is never
shown back to the user, because bcrypt is one way. That is deliberate: the alternative is storing
the four digits in a form the server could print, which would mean anyone who reached the database
could read every user's PIN. The read side of the feature therefore returns the *state* of the lock
— whether it is on, when it was last set, and how many digits to ask for — and the App lock screen
says in plain words that a forgotten PIN is turned off with the account password rather than looked up.

**Why `appPinSetAt` is worth a column.** Without it the App lock screen can only say "on" or "off".
With it the screen can say when the PIN was last changed, which is what tells a user whether the
lock is still the one they set or whether somebody else has been in the account.

**Nothing needed backfilling.** Every existing user has no `appPinHash`, which already means the
lock is off — the state every account started in.

**Deleting an account needs no new clean-up.** Both columns live on the `USER` document, so
`purgeUserAndOwnedData` removes them with the account itself; there is no separate row to chase.
