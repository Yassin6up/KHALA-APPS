# KHALA Platform

Multi-app backend (Node.js + MySQL) + the first product **قادر (Qader)** — a premium, fully-Arabic, RTL training & human-development app — plus a shared admin panel.

See **[PLAN.md](PLAN.md)** for the full architecture, data model, feature map, design system, and roadmap.

## Monorepo layout

```
/api          NestJS + Prisma (MySQL)  — the multi-app core API
/app-qader    Expo (React Native)      — the Qader app (RTL, Cairo, liquid glass)
/admin        Next.js                  — admin panel managing all apps
/packages/shared  TypeScript           — design tokens + shared types
```

Users are shared across apps; subscriptions, payments, referrals, content and
analytics are scoped per app via an `app_id` resolved from the `x-app-key` header.

## Getting started

### 1. Backend API
```bash
cp api/.env.example api/.env        # set DATABASE_URL (MySQL 8)
npm install                         # installs api + admin + shared (workspaces)
npm --workspace api run prisma:generate
npm --workspace api run prisma:migrate     # creates tables
npm --workspace api run seed               # seeds Qader app + 3 plans + samples
npm run api:dev                            # http://localhost:4000  (Swagger at /docs)
```

### 2. Admin panel
```bash
npm run admin:dev    # http://localhost:3001
```

### 3. Qader app (separate install — not in npm workspaces)
```bash
cd app-qader
npm install
npm run start        # Expo — press i / a, or scan the QR
```

## Auth quick test (after seeding)
```bash
# request an OTP (printed to the API console with OTP_PROVIDER=console)
curl -X POST http://localhost:4000/v1/auth/otp/request \
  -H "content-type: application/json" -H "x-app-key: qader" \
  -d '{"phone":"+96890000000"}'

# verify -> returns access + refresh tokens
curl -X POST http://localhost:4000/v1/auth/otp/verify \
  -H "content-type: application/json" -H "x-app-key: qader" \
  -d '{"phone":"+96890000000","code":"<code-from-console>"}'
```

## Payments
The billing layer is **provider-agnostic** (`api/src/billing/billing-provider.interface.ts`).
A `manual` provider is wired by default. Plug in **RevenueCat** (Apple/Google IAP)
and/or **Thawani** later without touching the rest of the app. See PLAN.md §7.
