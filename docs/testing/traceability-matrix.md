# Traceability matrix — requirement → prototype → implementation → test cases

Each member fills the **Implementation** and **Test cases** cells for their own rows once the feature is built and the
test cases exist in `docs/testing/functional/m0X-*.md`. Member 04 rows are pre-filled from `docs/PROJECT_PLAN.md` §6
(planned test IDs, not results). Requirement/prototype cells for Members 01–03 come from the Assignment 2 traceability;
confirm the exact Milestone 02 frame names against Figma.

| Requirement | Prototype screen (M02) | Implementation (screen + endpoint) | Test cases |
|---|---|---|---|
| FR-01 Login / register / OTP / profile (M01) | Login, Register, OTP verification, Profile | | |
| FR-04 Route search and details (M02) | Explore Routes, Route Details, Saved Routes | | |
| FR-02 / FR-03 Live tracking + nearest bus (M02) | Live Bus Tracking | | |
| FR-05 / FR-06 Seat booking, payment, digital ticket (M03) | Seat Selection, Payment, My Tickets / Ticket | | |
| FR-09 Ticket verification (M03) | Verify Ticket (QR / ticket key) | | |
| FR-10 Transaction report (M03) | Admin finance | | |
| FR-07 Notifications (M04) | Notifications (Variant B), Home | `notifications` module, `AlertSubscription`, unread badge | TC-N01 list · TC-N02 mark read · TC-N03 dismiss · TC-N04 subscribe/unsubscribe · TC-N05 delay → Live Tracking deep link |
| FR-08 Delay reporting (M04) | Driver Delay Reporting (Variant C) | `delays` module + ETA hook | TC-D01 create · TC-D02 history · TC-D03 update · TC-D04 resolve/cancel · TC-D05 ETA increases · TC-D06 passengers notified |
| FR-04 (entry) / NFR-05 (M04) | Home (Variant A) | `home` + `recentSearches` | TC-H01 search saves recent · TC-H02 delete recent · TC-H03 nearby buses · TC-H04 bus+ETA within 3 taps |
| FR-14 – FR-18 Admin dashboard (M04) | Admin Dashboard (Variant B) | `dashboard`, `announcements`, admin delay page | TC-A01 stats load · TC-A02 delay acknowledge · TC-A03 announcement CRUD · TC-A04 publish → passenger sees notification |
