# Usability test plan — Ceylon Smart Bus (Milestone 03)

Fill the bracketed planning items as a group. Results go **only** in `usability-session-log.md`, and only after a session has happened.

## 1. Objective
Check whether passengers, drivers and an administrator can complete the core journeys of the **built APK** and the
**hosted admin dashboard** without help, find the usability problems that remain, and fix the most severe ones.

## 2. Method
- Moderated task-based testing, think-aloud protocol, one participant at a time.
- **At least 5 participants** in total (real or proxy users): passengers, at least one driver role-player and one admin role-player.
- Device: Android phone with the release APK; admin on a laptop browser using the hosted URL.
- Each session: consent → short intro → tasks → post-task questions → closing feedback. Target 15–20 minutes.
- Moderator reads tasks aloud and does not guide; a second member takes notes and times tasks.

## 3. Participants
| ID | User type | Phone use (daily/occasional) | Uses public buses? |
|---|---|---|---|
| P1 | | | |
| P2 | | | |
| P3 | | | |
| P4 | | | |
| P5 | | | |

## 4. Tasks per flow
| Flow (owner) | Task given to the participant | Success criterion |
|---|---|---|
| Accounts (M01) | Register a new account and verify with the OTP, then log in | Lands on Home signed in |
| Routes (M02) | Find route 154 to Pettah and save it | Route appears in Saved Routes |
| Tracking (M02) | Track the next bus on a saved route and read its ETA | States the ETA shown |
| Tickets (M03) | Buy a ticket for a seat and open the QR | Ticket with QR is displayed |
| Verification (M03, driver) | Verify a passenger's ticket | Valid/invalid result shown |
| Inquiries (M03) | Submit an inquiry about a delayed bus | Inquiry listed as Open |
| Notifications (M04) | Turn on delay alerts for a route and read the latest alert | Subscription saved; alert opened |
| Delay reporting (M04, driver) | Report a 15-minute delay because of heavy traffic | Active delay banner shown |
| Admin (M04) | Publish an announcement to all passengers | Announcement status Published |

## 5. Metrics recorded per task
- **Completion** (completed / completed with help / failed)
- **Time on task** (seconds)
- **Errors** (wrong taps, wrong input) and **navigation errors** (wrong screen opened)
- **Assistance** requests (count)
- **Participant feedback** (quotes)
- **Issue severity**: **H** = blocks the task · **M** = causes delay or an error but task completed · **L** = cosmetic / minor annoyance

## 6. Consent and recording
- Ask for verbal or written consent before recording; record the screen (and audio only if agreed).
- Participants may stop at any time. Store recordings in the group drive; put only the link in the log.
- No personal data beyond first name / participant ID is written in the repository.

## 7. After the sessions
1. Group issues by severity; fix all H issues and as many M issues as time allows.
2. Record each fix (issue → change → commit/PR link) for the report's "issues and fixes" section.
3. Re-test fixed tasks with at least one participant where possible.
