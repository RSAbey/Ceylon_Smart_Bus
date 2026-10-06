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
