# منصة KHALA — الخطة الشاملة / KHALA Platform — Master Plan

> Multi-app backend (Node.js + MySQL) + first product **قادر (Qader)** — a premium, fully‑Arabic, RTL mobile app.
> This document is the single source of truth for architecture, data model, features, design system, and roadmap.

---

## 0. ملخص تنفيذي / Executive Summary

We are building **one backend that serves many apps** (Qader, Afia, …). Users are **shared across all apps** (one identity), but **subscriptions, payments, referrals, plans, content, and analytics are scoped per‑app**. A single **Admin Panel** manages every app from one place.

The first app, **قادر (Qader)**, is a human‑development / training platform for Oman (aligned with Oman Vision 2040). It is delivered **fully in Arabic (RTL)**, with a **modern premium "liquid glass" UI** and the **Cairo** Arabic font.

**Phasing (from the project doc):**
- **Phase 1 (MVP):** Smart booking & subscriptions, interactive camps, digital content library.
- **Phase 2 (Value):** AI assessment engine, 30/90‑day challenges, progress dashboard, 1‑on‑1 sessions, social hub, monthly subscriptions (3 tiers).
- **Phase 3 (Sustainability):** Gamification & rewards, B2B/enterprise portals.

---

## 1. قرارات التقنية / Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| **Backend** | **Node.js + NestJS (TypeScript)** | Modular architecture maps perfectly to "multi‑app" + "multi‑feature". Built‑in DI, guards, validation, OpenAPI. |
| **Database** | **MySQL 8** + **Prisma ORM** | Requested. Prisma gives type‑safe queries, migrations, clean multi‑tenant modeling. |
| **Cache / Queues / Realtime** | **Redis** + **Socket.IO** (chat) + **BullMQ** (jobs: notifications, AI tasks) | Community chat, daily tasks, reminders. |
| **Mobile app** | **React Native (Expo, TypeScript)** | First‑class RTL, easy Cairo font, `expo-blur` for liquid‑glass, OTA updates, Apple/Google sign‑in & IAP libs. |
| **Admin panel** | **Next.js (React) + shadcn/ui + Tailwind** | Fast to build, can reuse design tokens, role‑based dashboards. |
| **Auth** | **JWT (access + refresh)** + Apple Sign In + Google Sign In + Phone/Email OTP | Store‑compliant social login; OTP for Oman mobile numbers. |
| **Payments** | **Thawani** (Oman gateway, web/one‑off) **+ Apple IAP + Google Play Billing** (mobile subscriptions) | See §7 — store policy requires IAP for digital subscriptions on mobile. |
| **Storage / Media** | S3‑compatible (AWS S3 / Cloudflare R2) + CDN, **Mux/Cloudflare Stream** for video | Library: PDFs, images, videos, downloadable materials. |
| **Push / Notifications** | Expo Push / FCM + APNs | Daily tasks, camp schedule, session reminders. |
| **AI** | **Claude (claude-opus-4-8 / claude-sonnet-4-6)** via backend service | AI Mentor, smart assessment, personalized plans. |

> **Alternative considered:** Flutter for mobile. React Native chosen for tighter JS/TS sharing with the backend & admin, and mature Expo RTL/IAP ecosystem. Switchable if the team prefers Flutter — the backend is client‑agnostic (REST + WebSocket).

---

## 2. معمارية متعددة التطبيقات / Multi‑App Architecture

```
                         ┌──────────────────────────┐
                         │      Admin Panel (Next)   │
                         │  manages ALL apps         │
                         └─────────────┬────────────┘
                                       │
        ┌──────────────┐        ┌──────▼───────────────────────┐        ┌──────────────┐
        │ Qader (RN)   │───────▶│   KHALA Core API (NestJS)    │◀───────│ Afia (RN)    │
        │ app_id=qader │  REST  │  Multi-tenant by app_id      │  REST  │ app_id=afia  │
        └──────────────┘   +WS  └──────┬───────────────────────┘   +WS  └──────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              ▼                        ▼                         ▼
        ┌──────────┐            ┌──────────────┐          ┌──────────────┐
        │ MySQL 8  │            │  Redis       │          │ S3 + CDN     │
        │ (Prisma) │            │ cache/queues │          │ media        │
        └──────────┘            └──────────────┘          └──────────────┘
```

**Tenancy model — shared users, scoped everything else:**
- Every app‑scoped request carries an **`X-App-Key`** header (or app‑bound API key) → resolved to an `app_id` by a global **`AppContextGuard`**.
- One physical MySQL database; **`app_id` foreign key** on all app‑scoped tables (single‑DB multi‑tenancy). Clean, cheap, easy cross‑app user identity. Can shard later if needed.
- **`users`** = global identity. **`app_memberships`** = which apps a user has joined + per‑app profile/role.

### NestJS module layout
```
src/
  core/            # config, prisma, redis, guards (AppContextGuard, JwtGuard, RolesGuard)
  apps/            # app registry (register Qader, Afia…), feature-flag per app
  auth/            # JWT, Apple, Google, OTP, sessions, refresh tokens
  users/           # global identity + app_memberships
  billing/         # plans, subscriptions, payments, Thawani, IAP webhooks, entitlements
  referrals/       # codes, redemptions, rewards (per-app)
  catalog/         # workshops, programs, camps, products (e-commerce)
  bookings/        # booking & enrollment + scheduling for 1-on-1 sessions
  library/         # digital content (video/pdf/image), access control
  ai-mentor/       # assessment engine, plans, daily tasks, challenges
  community/       # rooms, messages (Socket.IO), moderation
  gamification/    # points, streaks, badges, rewards
  notifications/   # push, scheduled reminders (BullMQ)
  admin/           # admin-only endpoints + metrics
```

---

## 3. نموذج البيانات / Database Schema (MySQL, key tables)

> Per‑app tables all carry `app_id`. Money in **minor units (baisa)**; currency default `OMR`.

**Platform / tenancy**
- `apps(id, key, name_ar, name_en, status, theme_json, created_at)`
- `app_api_keys(id, app_id, key_hash, label, scopes, revoked_at)`

**Identity (shared)**
- `users(id, phone, email, full_name, avatar_url, locale='ar', country='OM', created_at)`
- `user_identities(id, user_id, provider[apple|google|otp|password], provider_uid, email, created_at)` — unique `(provider, provider_uid)`
- `app_memberships(id, user_id, app_id, role[user|trainer|org_admin], status, profile_json, joined_at)` — unique `(user_id, app_id)`
- `sessions(id, user_id, refresh_token_hash, device, app_id, expires_at)`

**Billing (per‑app)**
- `plans(id, app_id, code, name_ar, audience[individual|trainer_family|organization], price_minor, currency, interval[month|year], features_json, is_active)`
- `subscriptions(id, app_id, user_id, plan_id, status[trialing|active|past_due|canceled|expired], source[thawani|apple|google], current_period_end, store_txn_id, created_at)`
- `payments(id, app_id, user_id, subscription_id?, order_id?, amount_minor, currency, provider, provider_ref, status, raw_json, created_at)`
- `entitlements(id, app_id, user_id, feature_key, source, expires_at)` — fast “can this user access X?” checks
- `webhook_events(id, provider, event_id, payload_json, processed_at)` — idempotent webhook handling

**Referrals (per‑app)**
- `referral_codes(id, app_id, user_id, code UNIQUE, created_at)`
- `referral_redemptions(id, app_id, code_id, referred_user_id, reward_status, created_at)`
- `referral_rewards(id, app_id, user_id, type[points|discount|free_days], value, granted_for, created_at)`

**Catalog / commerce (per‑app)**
- `catalog_items(id, app_id, type[workshop|program|camp|course|product], title_ar, desc_ar, cover_url, price_minor, currency, capacity, starts_at, section[training|self_dev|workshops|camps], is_published)`
- `bookings(id, app_id, user_id, item_id, status[reserved|paid|attended|canceled], payment_id?, created_at)`
- `camp_schedule(id, app_id, camp_id, day_index, title_ar, content_ref, unlock_at)`
- `orders(id, app_id, user_id, total_minor, currency, status, created_at)` + `order_items(...)`

**Library (per‑app)**
- `library_assets(id, app_id, type[video|pdf|image|material], title_ar, url, duration?, size?, required_entitlement, is_downloadable)`
- `asset_progress(id, app_id, user_id, asset_id, progress_pct, completed_at)`

**AI Mentor (per‑app)**
- `assessments(id, app_id, user_id, kind[personality|skills|learning_style], answers_json, result_json, created_at)`
- `dev_plans(id, app_id, user_id, source_assessment_id, plan_json, status, created_at)`
- `challenges(id, app_id, user_id, kind[30|90], goal_ar, start_date, streak_count, status)`
- `daily_tasks(id, app_id, user_id, challenge_id?, title_ar, due_date, status, completed_at)`
- `consult_sessions(id, app_id, user_id, trainer_id, scheduled_at, duration_min, channel[audio|video], status)`

**Community (per‑app)**
- `rooms(id, app_id, name_ar, type[public|cohort|org], is_active)`
- `room_members(id, app_id, room_id, user_id, role)`
- `messages(id, app_id, room_id, user_id, body, attachments_json, created_at)` (+ moderation flags)

**Gamification (per‑app)**
- `points_ledger(id, app_id, user_id, delta, reason, ref_id, created_at)`
- `badges(id, app_id, code, name_ar, icon_url)` + `user_badges(...)`

---

## 4. ميزات تطبيق قادر / Qader Feature Map (by phase)

**Phase 1 — Core**
1. **نظام الحجز والاشتراك الذكي** — browse & book workshops/programs; secure local pay (Thawani) + store IAP for subscriptions.
2. **إدارة المعسكرات التفاعلية** — camp timeline, daily unlocking content, reminders/notifications.
3. **مكتبة المحتوى الرقمي** — videos, learning materials, downloadable self‑development exercises.

**Phase 2 — Value**
4. **محرك التقييم الذكي (AI Assessment)** — personality test, skills measurement, learning‑style analysis → strengths/weaknesses → routes content.
5. **تحديات الالتزام (30/90 يوم)** — habit programs with daily commitments & streaks.
6. **لوحة تتبع الإنجاز (Dashboard)** — progress, training hours, skills gained.
7. **الاستشارات الافتراضية (1‑on‑1)** — book audio/video sessions with certified trainers.
8. **المجتمع التفاعلي (Social Hub)** — rooms, discussions, Q&A, experience sharing.
9. **الاشتراكات الشهرية** — 3 tiers: **أفراد** / **مدربين‑معلمين‑عائلات** / **مؤسسات** with 24/7 monthly consultation access.

**Phase 3 — Sustainability**
10. **التلعيب والمكافآت (Gamification)** — points → rewards/discounts/certificates.
11. **بوابة المؤسسات (B2B Portals)** — closed groups for companies/government, own admin dashboard + performance reports.

---

## 5. تدفق الشاشات / Qader Screen Flow

```
Splash → Onboarding (3–4 slides) → Auth (Apple / Google / Phone OTP)
  → Smart Assessment (personality + learning style + skills)   [the competitive edge]
  → Personalized result + recommended trainer + dev plan
  → Paywall (3 tiers)  →  Main App (Tab bar)
```

**Bottom tab bar (RTL order, right→left):** الرئيسية · المرشد الذكي · المجتمع · المكتبة · حسابي
(E‑commerce/store accessible from الرئيسية + a dedicated "المتجر" entry.)

**Key screens:** Home (next session, progress ring, daily task, recommended workshops) · AI Mentor chat + plan + daily tasks · Assessment flow · Community rooms + chat · Library (video/pdf grid) · Store (workshops/camps/products + checkout) · Camp timeline · Booking & session scheduler · Dashboard · Profile/Settings · Subscription/Paywall · Referrals.

---

## 6. نظام التصميم — Liquid Glass / Design System

**Direction:** premium, calm, trustworthy, modern — dark‑first with a deep gradient base and **frosted “liquid glass” cards** (translucent surfaces, soft inner light, subtle borders, depth blur). Cairo font throughout. Full RTL.

**Typography (Cairo):** Display 32/700 · H1 24/700 · H2 20/600 · Body 16/400 · Caption 13/400. Generous line‑height for Arabic (1.6–1.8).

**Color tokens (suggested):**
```
--bg-0:        #0B1020   (deep navy base)
--bg-1:        #121A33
--brand:       #2EC5B6   (Qader teal — growth/clarity)  
--brand-2:     #6C8BFF   (accent indigo)
--gold:        #E9C46A   (achievement/premium)
--text-hi:     #F4F7FF
--text-lo:     #9AA6C4
--glass-fill:  rgba(255,255,255,0.06)
--glass-brd:   rgba(255,255,255,0.14)
--glass-blur:  24px
```

**Glass card recipe (RN, `expo-blur`):** `BlurView intensity≈40` + 1px `--glass-brd` border + `borderRadius 24–28` + soft drop shadow + a faint top highlight gradient. Light‑mode variant uses white glass over a soft gradient.

**Motion:** spring transitions, parallax on onboarding, animated progress rings, haptics on key actions. Keep it subtle — premium = restraint.

**RTL rules:** mirror layouts, icons, navigation, sliders; numbers/dates use Arabic locale; test every screen in RTL from day one (`I18nManager.forceRTL(true)`).

### مراجع التصميم الحقيقية (Lazyweb) / Real design references
Pulled from live apps to anchor each screen (open the links):

- **Onboarding / personality quiz (the competitive edge):**
  - Impulse — “what do you want to learn about yourself” multi‑select → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/health2_impulse/compare/2025-04-25-16-06-14-.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2hlYWx0aDJfaW1wdWxzZS9jb21wYXJlLzIwMjUtMDQtMjUtMTYtMDYtMTQtLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODI2NzczNTMsImV4cCI6MTgxNDIxMzM1M30.gmKRhuFRYQHIlR-BTFR6xSdTutBQpR3gLCj9qjIoEZ4)
  - Breeze — personality test intro w/ “what you get” + CTA → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/health136_breeze/compare/2024-07-15-00-53-47-.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2hlYWx0aDEzNl9icmVlemUvY29tcGFyZS8yMDI0LTA3LTE1LTAwLTUzLTQ3LS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyNjc3MzUzLCJleHAiOjE4MTQyMTMzNTN9.JuSw-wpgtjqNNaLrhO3b_tJkfBRXe6gzAAfJiU1Gbuc)
  - Halo Habits — “describe your ideal coach” trait picker → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/189z_halo-habits/compare/!coach-flow_step-1/2025_10_19_22-56-30_0DC4CD87.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzLzE4OXpfaGFsby1oYWJpdHMvY29tcGFyZS8hY29hY2gtZmxvd19zdGVwLTEvMjAyNV8xMF8xOV8yMi01Ni0zMF8wREM0Q0Q4Ny5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyNjc3MzUzLCJleHAiOjE4MTQyMTMzNTN9.Y8W1vzkWPxYxfcJ5RfufbC_M308B0BB4D7uJqwS4TF0)
- **Home / learning dashboard:**
  - Speak — welcome back + next lesson + progress + Start → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/edu121_speak/backlog/2025_08_30_23-07-43_6303CC7A.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2VkdTEyMV9zcGVhay9iYWNrbG9nLzIwMjVfMDhfMzBfMjMtMDctNDNfNjMwM0NDN0EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjY3MzY4NiwiZXhwIjoxODE0MjA5Njg2fQ.BWaLnK1JiOASdt1LwGO3JCUteglLZCckvIoWmOMo4qE)
  - Babbel — Today vs Plan tabs, lesson card, upsell → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/uploaded_babbel/main_tabs/compare/2026-05-27/1779936631730_00_Babbel-20260528-025031-01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL3VwbG9hZGVkX2JhYmJlbC9tYWluX3RhYnMvY29tcGFyZS8yMDI2LTA1LTI3LzE3Nzk5MzY2MzE3MzBfMDBfQmFiYmVsLTIwMjYwNTI4LTAyNTAzMS0wMS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyNjczNjg2LCJleHAiOjE4MTQyMDk2ODZ9.oRAFJPwIIT0p9xVng_2OUPLNpPQwtyVAceuYxs0QjII)
  - MasterClass — premium dark home, carousels of course cards → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/edu112_masterclass/compare/2024-05-05-18-40-31-.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2VkdTExMl9tYXN0ZXJjbGFzcy9jb21wYXJlLzIwMjQtMDUtMDUtMTgtNDAtMzEtLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODI2NzczNjIsImV4cCI6MTgxNDIxMzM2Mn0.m_yiT2S6ljLqd6dyzwzN4biNg7k60_NX6g2DdTB2T4Q)
- **Paywall / subscription (3 tiers):**
  - ThemePack — “Unlock Everything” benefits + trial + Continue → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/graphics4_themepack/compare/h_image%20(1)%20(2).png_IMG_4307.png/image%20(1)%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2dyYXBoaWNzNF90aGVtZXBhY2svY29tcGFyZS9oX2ltYWdlICgxKSAoMikucG5nX0lNR180MzA3LnBuZy9pbWFnZSAoMSkgKDIpLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODI2NzczNjQsImV4cCI6MTgxNDIxMzM2NH0.n7AqJ9Mwee-nlD6-ZonWMXriLEVvyNjqusNTuMtvseQ)
  - Syffer — weekly/monthly/yearly plan selector + free trial → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/safari8_syffer/compare/2024-07-21-16-33-09-.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL3NhZmFyaThfc3lmZmVyL2NvbXBhcmUvMjAyNC0wNy0yMS0xNi0zMy0wOS0ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjY3NzM2NCwiZXhwIjoxODE0MjEzMzY0fQ.ile4OmllSw9J9gj8TnJDvULgnGZyhcNswZAhjphpgvo)
- **Community / social hub:**
  - Blind — My Chats vs Public, searchable room cards → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/news116_blind/compare/2025-04-25(19-02-07).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL25ld3MxMTZfYmxpbmQvY29tcGFyZS8yMDI1LTA0LTI1KDE5LTAyLTA3KS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyNjc3MzY1LCJleHAiOjE4MTQyMTMzNjV9.hTfGtDfEzmZljXkKvDfnbczFY6RLg0C8w1p4GOOSfhQ)
  - Atlys — community grid “talk to others / ask questions” → [view](https://zlfyzdmohcskkucuunmk.supabase.co/storage/v1/render/image/sign/screenshots/ingest/any_app_flow_runs/atlys/VDC.VDCApp/20260214-033243/flow_03_Community/002_step_01.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81NTU0MmU4OC1mNWRkLTQxMDEtOWZkYy0yODFiMzM3NmYyOTIiLCJhbGciOiJIUzI1NiJ9.eyJ0cmFuc2Zvcm1hdGlvbnMiOiJ3aWR0aDo3NjgscmVzaXplOmNvbnRhaW4scXVhbGl0eTo3MCIsInVybCI6InNjcmVlbnNob3RzL2luZ2VzdC9hbnlfYXBwX2Zsb3dfcnVucy9hdGx5cy9WREMuVkRDQXBwLzIwMjYwMjE0LTAzMzI0My9mbG93XzAzX0NvbW11bml0eS8wMDJfc3RlcF8wMS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyNjc3MzY1LCJleHAiOjE4MTQyMTMzNjV9.T2L1eiS0xXUhGgXN77bhBYxuA7wr2unugspYlBle-oo)

---

## 7. الدفع والاشتراكات / Payments & Subscriptions (important nuance)

- **Mobile in‑app digital subscriptions** (the 3 monthly tiers, unlocking digital content) **must use Apple IAP / Google Play Billing** per store policy. Use **RevenueCat** to unify both stores + sync entitlements to our backend via webhooks.
- **Thawani** is used for: **web checkout**, and **physical/real‑world items** where allowed (e.g., paid in‑person workshops/camps, products) — store rules permit external payment for physical goods/services.
- Backend keeps the **single source of truth** for entitlements: store webhooks (RevenueCat) + Thawani webhooks → `subscriptions` / `entitlements`. App always asks the backend “what can this user access?”.
- **Referrals & rewards** computed server‑side (free days / discount codes / points), scoped per app.

---

## 8. الأمان / Security & Compliance
- JWT access (short) + refresh rotation; device‑bound sessions.
- Apple/Google token verification server‑side; OTP rate‑limited.
- `AppContextGuard` + `RolesGuard` on every route; row‑level `app_id` scoping enforced in a Prisma middleware.
- Idempotent webhooks (`webhook_events`), signed payload verification.
- PII minimization, encrypted secrets, audit log for admin actions.
- Content access gated by `entitlements` (no client‑trust).

---

## 9. خارطة الطريق / Delivery Roadmap

| Sprint | Backend | Qader app | Admin |
|---|---|---|---|
| **0 — Foundations (1–2 wk)** | Repo, NestJS skeleton, Prisma schema, `apps`/`users`/auth, AppContextGuard | Expo app, RTL + Cairo, design tokens, glass components, navigation | Next.js skeleton, auth, app switcher |
| **1 — Auth + Onboarding** | Apple/Google/OTP, sessions, memberships | Splash, onboarding, auth, smart assessment flow | Users list, apps registry |
| **2 — Catalog + Booking + Pay** | catalog, bookings, Thawani, IAP/RevenueCat webhooks, plans/subscriptions | Home, Store, item detail, checkout, paywall (3 tiers) | Catalog & plan management |
| **3 — Library + Camps** | library assets + entitlements, camp schedule, notifications | Library grid/player, camp timeline, reminders | Content upload, camp builder |
| **4 — AI Mentor** | assessment engine, dev plans, challenges, daily tasks, Claude integration | Mentor chat, plan, daily tasks, dashboard | Plan templates, AI prompt config |
| **5 — Community + Sessions** | rooms/messages (Socket.IO), 1‑on‑1 scheduling | Community rooms/chat, session booking | Moderation, trainer mgmt |
| **6 — Gamification + Referrals + B2B** | points, badges, referrals, org portals | Rewards, referrals, profile | Reports, B2B org dashboards |

---

## 10. الخطوات التالية / Immediate Next Steps
1. Confirm stack choices (RN + NestJS + Prisma/MySQL) and the **RevenueCat + Thawani** payment split.
2. Scaffold the monorepo: `/api` (NestJS), `/app-qader` (Expo), `/admin` (Next.js), `/packages/shared` (types, design tokens).
3. Implement Prisma schema (§3) + `AppContextGuard` + auth.
4. Build the Qader **design system package** (Cairo, glass components, tokens) and the onboarding→assessment→paywall flow first (highest‑impact, sets the premium tone).

---
*Generated as the master plan; each section can be expanded into its own detailed spec on request.*
