# Functional test cases — Member 01 (Accounts)

> **Actual result and Pass/Fail stay EMPTY until the test has really been executed** (on the APK / hosted admin).
> Cover Create, Read, Update, Delete, validation errors and wrong-role access for every interface.
> TC-ID format: `TC-<area letter><number>`. Requirement ID = FR-xx / NFR-xx.

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-A01 | Choose account type | App open, signed out | Open Register from Sign In → select Passenger → Continue | The Sign Up form opens showing step "2 of 4" | | | FR-01 |
| TC-A02 | Driver cannot self-register | App open, signed out | Open Register → select Driver / Partner | A notice explains driver accounts are created by admins; a "Sign in" link is offered and no sign-up form appears | | | FR-01 |
| TC-A03 | Register a passenger (Create) | No account with this email/mobile | Enter name, email, Sri Lankan mobile, 8+ char password, tick terms → Agree & Register | Account is created and the Verification screen opens showing the masked mobile and a 60 s countdown | | | FR-01 |
| TC-A04 | Register — invalid email | On Sign Up | Enter `alex@domain` → Agree & Register | Inline error "Please enter a valid email address (e.g. name@domain.com)"; no account is created | | | FR-01 |
| TC-A05 | Register — short password | On Sign Up | Enter a 5-character password → Agree & Register | Inline error "Password must be at least 8 characters." | | | FR-01, NFR-07 |
| TC-A06 | Register — terms not accepted | On Sign Up, all fields valid | Leave the terms box unticked → Agree & Register | Inline error "Please accept the Terms of Service and Privacy Policy." | | | FR-01 |
| TC-A07 | Register — duplicate email | An account already uses the email | Register with that email | Error "This account already exists." shown against the email field | | | FR-01 |
| TC-A08 | Verify OTP — wrong code | On Verification with a pending code | Enter 6 wrong digits → Verify & Confirm | Warning "Invalid confirmation code. Remaining attempts: 2"; boxes clear | | | FR-01, NFR-07 |
| TC-A09 | Verify OTP — attempts exhausted | On Verification | Enter a wrong code three times | "Too many incorrect attempts. Please request a new code."; the old code no longer works even if correct | | | NFR-07 |
| TC-A10 | Resend OTP | On Verification, countdown finished | Wait for the countdown to reach 0:00 → tap Resend code | A new code is issued, the countdown restarts at 60 s, and the previous code stops working | | | FR-01 |
| TC-A11 | Verify OTP — correct code | On Verification with a pending code | Enter the correct 6 digits → Verify & Confirm | "Verification Successful" (step 4 of 4) with the activated profile and an Active badge | | | FR-01 |
| TC-A12 | Reach Home after registering | On the success screen | Tap Get Started | The passenger Home tab opens and the user stays signed in | | | FR-01 |
| TC-A13 | Sign in with email | A verified account exists | Enter email + password → Sign In | The passenger lands on Home | | | FR-01 |
| TC-A14 | Sign in with mobile number | A verified account exists | Enter the mobile number + password → Sign In | The passenger lands on Home | | | FR-01 |
| TC-A15 | Sign in — wrong password | Account exists | Enter the correct email with a wrong password | Error "Incorrect email/mobile number or password."; the message does not reveal whether the account exists | | | NFR-07 |
| TC-A16 | Remember me off | On Sign In | Untick Remember me → sign in → fully close and reopen the app | The app returns to Sign In rather than restoring the session | | | NFR-07 |
| TC-A17 | Remember me on | On Sign In | Leave Remember me ticked → sign in → fully close and reopen the app | The app opens straight on Home, still signed in | | | FR-01 |
| TC-A18 | Admin blocked from mobile app | Admin account exists | Sign in on the mobile app with admin credentials | Message "Admins use the web dashboard." and no mobile session is created | | | NFR-07 |
| TC-A19 | View profile (Read) | Signed in as a passenger | Open the Profile tab | Name, initials avatar, "Member since", and the settings rows are shown | | | FR-01 |
| TC-A20 | Edit profile (Update) | On Profile | Tap Edit → change the full name → Save changes | Success toast appears and the new name shows on Profile and after reopening the app | | | FR-01 |
| TC-A21 | Edit profile — invalid mobile | On Edit Profile | Enter `123` as the mobile number → Save changes | Inline error "Enter a Sri Lankan mobile number, for example 0771234567."; nothing is saved | | | FR-01 |
| TC-A22 | Edit profile — duplicate email | Another account uses the email | Enter that email → Save changes | Error "Another account already uses this email address." | | | FR-01 |
| TC-A23 | Delete own account (Delete) | Signed in as a passenger | Edit Profile → Delete my account → confirm | The account is removed, the app returns to Sign In, and the old credentials no longer work | | | FR-01 |
| TC-A24 | Log out | Signed in | Profile → Log out → Sign out | The confirmation dialog appears, then the app returns to Sign In | | | FR-01 |
| TC-A25 | Admin sign in (dashboard) | Admin account exists | Open the dashboard → enter admin credentials → Sign In | The Overview page opens with the admin's name in the top bar | | | FR-01 |
| TC-A26 | Passenger blocked from dashboard | Passenger account exists | Sign in to the dashboard with passenger credentials | Message that only administrators may use the dashboard; no session is created | | | NFR-07 |
| TC-A27 | Protected route redirect | Signed out of the dashboard | Open `/drivers` directly in the browser | The dashboard redirects to `/login` | | | NFR-07 |
| TC-A28 | Register a driver (Create) | Signed in as admin | Drivers → Register driver → fill all fields → Register driver | The driver appears at the top of the table with an Active badge | | | FR-01 |
| TC-A29 | Register driver — invalid NIC | On the register driver form | Enter `abc` as the NIC → submit | Inline error "Enter a valid NIC, for example 199007158812." | | | FR-01 |
| TC-A30 | Register driver — duplicate licence | A driver already has that licence | Register another driver with the same licence number | Error "Another driver already has this licence number." against the field | | | FR-01 |
| TC-A31 | List drivers (Read) | Drivers exist | Open the Drivers page | The table lists each driver with name, email, mobile, licence, NIC and status | | | FR-01 |
| TC-A32 | Edit driver (Update) | A driver exists | Drivers → Edit → change the licence number → Save changes | Toast confirms, and the table shows the new licence number | | | FR-01 |
| TC-A33 | Block a driver (Update) | An active driver exists | Drivers → Block / Unblock | The badge changes to Blocked, and that driver can no longer sign in to the mobile app | | | NFR-07 |
| TC-A34 | Delete a driver (Delete) | A driver exists | Drivers → Delete → confirm | The row disappears and the driver's credentials no longer work | | | FR-01 |
| TC-A35 | Admin cannot block themselves | Signed in as admin | Attempt to block your own account | The action is refused with a clear message | | | NFR-07 |
| TC-A36 | Drivers list empty state | No drivers registered | Open the Drivers page | "No drivers registered yet" with guidance to register the first driver | | | FR-01 |
| TC-A37 | Drivers list error state | API stopped | Open the Drivers page | An error message with a working "Try again" button is shown | | | FR-01 |
| TC-A38 | Passenger roster (Read) | Passengers exist | Open the Passengers page | Each passenger is listed with contact details, when they joined, tickets bought and active, wallet balance, open inquiries and account status | | | FR-01, FR-10 |
| TC-A39 | Roster counts | As TC-A38 | Look above the table | Passengers, Active, Blocked and New this week are shown, and Active plus Blocked equals the total | | | FR-10 |
| TC-A40 | Search a passenger | As TC-A38 | Search part of a name, email or mobile number | Only matching passengers are listed, and the four counts still describe everyone | | | FR-01 |
| TC-A41 | Status filter | A blocked passenger exists | Press Blocked | Only blocked accounts are listed | | | FR-01 |
| TC-A42 | Open a passenger record | As TC-A38 | Press Open on a row | Their contact details, tickets bought, fares paid, wallet balance, saved routes, latest five tickets and open inquiries are shown | | | FR-01, FR-10 |
| TC-A43 | Figures match the app | A passenger with tickets and a wallet | Compare the record with that passenger's own My Tickets and Wallet screens | The ticket count and balance are the same on both sides | | | FR-10 |
| TC-A44 | Block warns about tickets | A passenger holding an active ticket | Press Block account | The dialog says how many active tickets they hold and that blocking does not cancel them | | | NFR-04, NFR-07 |
| TC-A45 | Block a passenger (Update) | An active passenger | Confirm the block | A toast confirms, the badge reads Blocked, the Blocked count rises, and that passenger can no longer sign in to the app | | | NFR-07 |
| TC-A46 | A blocked session stops working | TC-A45 done while that passenger is signed in on a phone | Use the app | The next request is refused, even though the token has not expired | | | NFR-07 |
| TC-A47 | Unblock (Update) | A blocked passenger | Press Unblock account and confirm | The badge returns to Active and they can sign in again | | | NFR-07 |
| TC-A48 | A driver is not a passenger | Note a driver's user id | Open `/api/admin/users/passengers/<that id>` | 404 Passenger not found | | | NFR-08 |
| TC-A49 | Wrong role | Signed in as a passenger or driver | Request `GET /api/admin/users/passengers` | 403 | | | NFR-08 |
| TC-A50 | Passengers empty state | No passenger matches the filter | Search for something no account matches | "No passengers match" with guidance to clear the filter, not an error | | | FR-01 |
| TC-A51 | Open your own profile | Signed in as admin | Click your name in the top bar | My profile opens with your name, role, contact details and join date | | | FR-01 |
| TC-A52 | Your activity | As TC-A51 | Look at the three figures | Notifications you published, replies you wrote and inquiries assigned to you, each matching what the Notifications and Inquiries pages show | | | FR-10 |
| TC-A53 | Edit your own details (Update) | As TC-A51 | Change your name → Save details | A toast confirms and the name in the top bar changes without a reload | | | FR-01 |
| TC-A54 | Details validation | As TC-A51 | Enter `12345` as the mobile → Save details | Inline error naming the Sri Lankan format; nothing is saved | | | FR-01 |
| TC-A55 | Email already used | Another account uses that email | Enter it → Save details | Error against the email field | | | FR-01 |
| TC-A56 | Passwords must match | As TC-A51 | Type two different new passwords → Change password | "Both new password boxes must match."; nothing is sent | | | NFR-07 |
| TC-A57 | New password too short | As TC-A51 | Enter a 5-character new password | "Password must be at least 8 characters." | | | NFR-07 |
| TC-A58 | Wrong current password | As TC-A51 | Enter the wrong current password with a valid new one | "That is not your current password." under that field, **and you stay signed in** | | | NFR-07 |
| TC-A59 | Change your password (Update) | As TC-A51 | Enter the correct current password and a new one twice | A toast confirms; signing out and back in works with the new password and fails with the old one | | | NFR-07 |
| TC-A60 | Same password refused | As TC-A51 | Enter your current password as the new one | Refused with a message telling you to choose a different one | | | NFR-07 |


## Development checks already run (not a substitute for the table above)

The passenger roster and blocking were exercised with a throwaway script against the development
server and MongoDB Atlas on 2026-10-08: **40 assertions, all passing**, covering the roster and its
filters, the figures on each row against the passenger's own ticket and wallet screens, one
passenger's record, and blocking through to the refused sign-in, the refused existing session, the
self-block refusal and the restore.

A second script covered the administrator's own profile on 2026-10-08: **30 assertions, all
passing**, covering the activity figures against the Notifications and Inquiries data, editing and
restoring the account's own details, and the whole password path — the refusals for a missing,
short, wrong or unchanged password, the successful change, the old password no longer working, and
the seeded password put back at the end.

That is a developer check on localhost, **not** the device testing this table records. Every Actual
and Pass/Fail cell above stays empty until the case is run on the APK and the hosted dashboard.
