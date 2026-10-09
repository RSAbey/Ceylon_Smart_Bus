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
| TC-A61 | Sign-in page layout | Signed out, window wider than 900px | Open the dashboard | The brand panel is on the left and the form on the right | | | FR-01 |
| TC-A62 | Sign-in on a narrow window | Signed out, window under 900px | Open the dashboard | Only the form is shown, filling the screen | | | NFR-10 |
| TC-A63 | Empty sign-in | On the sign-in page | Press Sign in with both boxes empty | Both fields are outlined and name what is missing; nothing is sent | | | FR-01 |
| TC-A64 | Wrong password | On the sign-in page | Enter a correct email with a wrong password | A banner carries the server's message and the page stays put | | | FR-01, NFR-07 |
| TC-A65 | Reveal the password | On the sign-in page | Type a password and press the eye | The characters become readable and the button changes to Hide password | | | NFR-10 |
| TC-A66 | Sign in returns you where you were | Signed out, open `/fleet` | Sign in | The dashboard lands on Live Fleet, not Overview | | | FR-01 |
| TC-A67 | Driver edits their own details | Signed in as a driver | Profile → Edit profile | The edit screen opens and saves; it does not bounce back to the driver home | | | FR-01 |
| TC-A68 | Driver opens Terms and Privacy | Signed in as a driver | Profile → Terms of Service, then Privacy Policy | Each screen opens (placeholder content is fine); neither bounces back to Home | | | FR-01 |
| TC-A69 | Strength meter fills up | On Sign Up | Type `a`, then `aaaaaaaa`, then `Aaaaaaaa`, then `Aaaaaaa@` | The three segments turn green one at a time, and the line under them says what is still missing | | | FR-01, NFR-07, NFR-09 |
| TC-A70 | Weak password refused | On Sign Up | Enter `password` and submit | The field explains that the three rules are not met and nothing is sent | | | NFR-07 |
| TC-A71 | Confirm password must match | On Sign Up | Enter two different passwords → Agree & Register | "Both password boxes must match." and nothing is sent | | | FR-01 |
| TC-A72 | Request a reset code | Signed out, an account exists | Sign in → Forgot Password? → enter that email → Send reset code | The screen moves to the code step and counts down from 5:00 | | | FR-01 |
| TC-A73 | The code arrives by email | TC-A72 with RESEND_API_KEY set | Open the mailbox of that address | An email with a 6-digit code and the 5-minute notice | | | FR-01 |
| TC-A74 | Unknown email says the same | Signed out | Ask for a reset for an address with no account | The same screen and countdown appear; no email is sent | | | NFR-07 |
| TC-A75 | Wrong code | On the code step | Enter six wrong digits | "Invalid confirmation code. Remaining attempts: 2" | | | NFR-07 |
| TC-A76 | Reset the password | On the code step with the right code | Enter the code and a password meeting all three rules | A toast confirms, the app returns to Sign In, and the new password works while the old one does not | | | FR-01, NFR-07 |
| TC-A77 | Expired code | On the code step | Wait for the countdown to reach 0:00 | The pill says the code has expired and Save is disabled until a new code is sent | | | NFR-07 |
| TC-A78 | A code works only once | TC-A76 done | Try the same code again | Refused; a new code is needed | | | NFR-07 |
| TC-A79 | Change password | Signed in as a passenger or driver | Profile → Change password → current, new, confirm | A toast confirms; the new password signs in afterwards | | | NFR-07 |
| TC-A80 | Change password, wrong current | As TC-A79 | Enter the wrong current password | "That is not your current password." under that field, and you stay signed in | | | NFR-07 |
| TC-A81 | Delete asks for the password | Signed in as a passenger | Edit profile → Delete my account | A sheet asks for the account password and says what will be removed | | | FR-01, NFR-07 |
| TC-A82 | Wrong password does not delete | As TC-A81 | Enter the wrong password | "That is not your password." in the sheet; the account still works | | | NFR-07 |
| TC-A83 | Delete removes everything | A passenger with a ticket, wallet balance and an open inquiry | Confirm the delete with the right password | The app returns to Sign In; that email no longer signs in; the admin roster and the support inbox no longer show them or their inquiry | | | FR-01 |
| TC-A84 | A driver mid-trip cannot delete | Driver with a trip running | Try to delete the account | Refused with a message to end the trip first | | | FR-02 |
| TC-A85 | App lock starts off | Signed in, never set a PIN | Profile → App lock | "App lock is off" with the warning, and the Choose a PIN form | | | NFR-07 |
| TC-A86 | Create a PIN | On App lock, lock off | Type the same 4 digits in both boxes → Turn on app lock | A toast confirms and the card becomes "App lock is on" with today's date | | | NFR-07 |
| TC-A87 | Mistyped confirm PIN | On App lock, lock off | Type 1234 then 1235 | "Both PIN boxes must match." and nothing is saved | | | NFR-07 |
| TC-A88 | Short PIN refused | On App lock, lock off | Type 12 and submit | "Enter all the digits of your PIN." and nothing is saved | | | NFR-07 |
| TC-A89 | The lock appears on reopening | TC-A86 done, Remember me was ticked | Close the app fully and reopen it | The lock screen covers the app before any other screen is readable | | | NFR-07 |
| TC-A90 | The right PIN unlocks | On the lock screen | Tap the 4 correct digits | The dots fill and the app opens on the screen it would have opened on | | | NFR-07 |
| TC-A91 | A wrong PIN | On the lock screen | Tap 4 wrong digits | "That is not your PIN. 4 tries left.", the dots clear and you stay locked | | | NFR-07, NFR-09 |
| TC-A92 | Wrong tries survive a restart | After TC-A91 | Close the app, reopen it, type a wrong PIN again | The count continues (3 tries left), it does not start again at 4 | | | NFR-07 |
| TC-A93 | Out of tries | On the lock screen | Get the PIN wrong five times | The app signs out and shows the sign-in screen | | | NFR-07 |
| TC-A94 | The way back without the PIN | On the lock screen | Tap "Use my password instead" | The app signs out and the sign-in screen appears | | | NFR-07 |
| TC-A95 | No PIN when Remember me is unticked | PIN set, sign out, sign in with Remember me unticked | Close the app and reopen it | The sign-in screen appears, not the lock screen | | | NFR-07 |
| TC-A96 | No PIN right after signing in | PIN set | Sign in with the password | The app opens straight away; the PIN is not asked for on top of the password | | | NFR-07 |
| TC-A97 | Change the PIN | PIN set | App lock → Change your PIN → current, new, new again | A toast confirms; the new PIN unlocks on the next launch and the old one does not | | | NFR-07 |
| TC-A98 | Change with the wrong current PIN | PIN set | Enter the wrong current PIN | "That is not your current PIN." under that field, and the PIN is unchanged | | | NFR-07 |
| TC-A99 | The PIN is never shown | PIN set | Read the App lock screen | It states the PIN cannot be shown back and says to turn the lock off with the password instead; no screen anywhere shows the digits | | | NFR-07 |
| TC-A100 | Turn the lock off | PIN set | App lock → Turn off app lock → account password | A toast confirms, the card says off, and the next launch asks for no PIN | | | NFR-07 |
| TC-A101 | Turn off with the wrong password | PIN set | Enter the wrong password in the sheet | "That is not your password." and the lock stays on | | | NFR-07 |
| TC-A102 | The PIN is not the password | PIN set | Type the PIN into the Turn off sheet's password box | Refused; the account password is what is asked for | | | NFR-07 |
| TC-A103 | A driver has the same lock | Signed in as a driver | Profile → App lock, then set, change and remove a PIN | Every step behaves as it does for a passenger | | | FR-02, NFR-07 |
| TC-A104 | The lock does not survive the account | PIN set | Delete the account, register again with the same email | The new account opens with no lock | | | NFR-07 |


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

A third script covered the password features on 2026-10-09: **33 assertions, all passing**, covering
the three password rules on registration, reset and change, the reset code from request to new
password (including the same answer for an unknown address, a wrong code, an expiry five minutes
away and a code that cannot be reused), and deleting a throwaway account with a wallet and an
inquiry through to its disappearance from the admin roster and the support inbox. The email itself
was not sent, because no Resend key was configured on the machine that ran the script.

A fourth script ran once the Resend key was in `server/.env`, on 2026-10-09: **10 of 11 assertions
passing** (the one failure was the script asking for a seeded address that does not exist in this
database, not a fault in the flow). A temporary account was registered on the Resend account
owner's mailbox, asked for a reset code, and had its password reset with the code that was emailed;
the account was deleted again afterwards. Resend's own record for that message reports
`last_event: delivered`, which is the evidence for TC-A73 at API level — nobody opened the mailbox
during the check, so TC-A73 itself is still for the device run to confirm. The same script also
showed that an address Resend refuses (any `@example.com` address, which Resend rejects outright)
does not stop a reset in development, because the code still comes back in the response there.

A fifth script covered the app lock PIN on 2026-10-09: **42 assertions, all passing**, covering the
whole CRUD and the unlock check — the state before any PIN exists, the refusals for changing,
removing or unlocking a PIN that is not there, five malformed PINs rejected, creating one, the
refusal to create a second over it, that neither the PIN nor its hash appears in any response,
a wrong PIN refused as 422 with the session left intact, changing the PIN with the old one then
failing and the new one working, the set date moving with the change, removing it with the password
only (a missing password, a wrong password and the PIN itself in place of the password are all
refused), and a PIN disappearing with the account it belonged to.

The mobile side of the feature was additionally checked by asking Metro to build the Android bundle,
which compiled every new screen, component and route without a resolution error. That proves the
wiring, **not** the behaviour: the lock screen, the keypad and the three sheets have not been seen
on a device, which is what TC-A85 to TC-A104 above are for.

That is a developer check on localhost, **not** the device testing this table records. Every Actual
and Pass/Fail cell above stays empty until the case is run on the APK and the hosted dashboard.
