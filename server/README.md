# Urbanmate API

Node.js and Express API for the home services marketplace. The backend is organized as a modular monolith, with Sequelize models, MySQL migrations, and domain-oriented MVC modules.

## Requirements

- Node.js 20+
- MySQL 8+

## Setup

1. Create a MySQL database (the default name is `urbanmate`).
2. Copy `.env.example` to `.env` and set database credentials, a private JWT secret of at least 32 characters, SMTP credentials, the reset-page URL, and the appropriate currency/origin. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` temporarily if bootstrapping the first admin.
3. Install packages and initialize the schema:

   ```sh
   npm install
   npm run db:migrate
   npm run db:seed
   ```

4. Remove bootstrap admin credentials from `.env` after the seeder succeeds. The seeder refuses to add the admin role to an existing non-admin account. Additional admins can be created by an authenticated admin through `POST /api/v1/auth/admin/register`.
5. Start the API:

   ```sh
   npm run dev
   ```

The API listens on port `4000` by default. Liveness and readiness endpoints are available at `/health/live` and `/health/ready`.

## API conventions

Versioned routes use `/api/v1` by default. Responses have a consistent envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Failures return `success: false`, a stable error `code`, a safe message, and a request ID. Validation errors include field details outside production. Collection endpoints return pagination metadata. Protected endpoints require a JWT bearer access token; role checks are enforced server-side. Access tokens are short-lived. A rotating opaque refresh token is stored hashed in MySQL and sent only as an HttpOnly, SameSite=Strict cookie. Refresh-token reuse revokes the user's active refresh sessions. Cookies require credentialed CORS from the configured frontend origin.

### Initial endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register and sign in as a customer |
| POST | `/api/v1/auth/provider/register` | Public | Register provider profile (starts pending approval) |
| POST | `/api/v1/auth/admin/register` | Admin | Create another admin account |
| POST | `/api/v1/auth/login` | Public | Sign in as any account type; returns the user's roles |
| POST | `/api/v1/auth/provider/login` | Public | Provider-only login alias |
| POST | `/api/v1/auth/admin/login` | Public | Admin-only login alias |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh token and issue an access token |
| POST | `/api/v1/auth/logout` | Refresh cookie | Revoke refresh token |
| GET | `/api/v1/auth/me` | Authenticated | Return the current account and roles |
| POST | `/api/v1/auth/password/forgot` | Public | Request a password reset email |
| POST | `/api/v1/auth/password/reset` | Public | Consume a one-time reset token and change password |
| POST | `/api/v1/auth/otp/email/request` | Authenticated | Send an email verification code |
| POST | `/api/v1/auth/otp/email/verify` | Authenticated | Verify the six-digit email code |
| PATCH | `/api/v1/auth/admin/users/:userId/status` | Admin | Activate or suspend an account |
| GET | `/api/v1/catalog/categories` | Public | List active categories |
| GET | `/api/v1/catalog/categories/:categoryId` | Public | Get category and active subcategories |
| GET | `/api/v1/catalog/cities` | Public | List active service cities |
| GET | `/api/v1/catalog/services/:serviceId` | Public | Get service details, packages, add-ons, and location price |
| GET | `/api/v1/catalog/services` | Public | List active services |
| GET | `/api/v1/catalog/services/:serviceId/price?cityId=...&areaId=...` | Public | Calculate the current service price for a location |
| GET | `/api/v1/addresses` | Customer | List the caller's addresses |
| POST | `/api/v1/addresses` | Customer | Create an address |
| POST | `/api/v1/bookings` | Customer | Create a pending booking |
| GET | `/api/v1/bookings` | Customer/provider/admin | List bookings visible to the caller |
| GET | `/api/v1/providers` | Public | Find online, identity-verified, approved providers |
| GET | `/api/v1/providers/:providerId` | Public | View a provider's public profile and working hours |
| GET | `/api/v1/providers/:providerId/reviews` | Public | List published provider reviews |
| POST | `/api/v1/providers/reviews` | Customer | Review a provider after a completed booking |
| GET/PATCH | `/api/v1/providers/me/profile` | Provider | Read or update personal/professional profile |
| PUT/GET | `/api/v1/providers/me/services` | Provider | Manage selected services and optional custom prices |
| PUT/GET | `/api/v1/providers/me/service-areas` | Provider | Manage provider coverage areas |
| PUT/GET | `/api/v1/providers/me/availability` | Provider | Replace or read working-hour windows |
| PATCH | `/api/v1/providers/me/online-status` | Provider | Go online or offline |
| POST | `/api/v1/providers/me/documents/upload` | Provider | Create a short-lived private upload URL |
| POST | `/api/v1/providers/me/documents/:documentId/complete` | Provider | Verify and complete an uploaded document |
| GET | `/api/v1/providers/me/earnings` | Provider | View commissions by currency and settlement status |
| GET/PATCH | `/api/v1/providers/admin/applications` | Admin | List applications or view application details |
| PATCH | `/api/v1/providers/admin/applications/:providerId/decision` | Admin | Approve, reject, or suspend an application |
| PATCH | `/api/v1/providers/admin/documents/:documentId/review` | Admin | Approve or reject an uploaded document |

Customer registration only grants the customer role. Provider registration only grants the provider role and creates a provider profile in pending approval. The first admin is created by the controlled bootstrap seeder; subsequent admin accounts require an authenticated admin and cannot be registered publicly. For local testing only, setting `ALLOW_DEV_ADMIN_REGISTRATION=true` in `.env` allows admin registration without a token when the request arrives over a loopback connection (`127.0.0.1` or `::1`). This option defaults to false and is ignored unless `NODE_ENV=development`; production always requires an admin token. Do not enable this option on a deployed server. The shared login endpoint returns the account roles so the client can select the appropriate workspace. Role-specific login aliases remain available for integrations. Use `authorize` for general role checks, `authorizeExclusive` for provider/admin-only surfaces, and `requireApprovedProvider` for operations that require an approved provider profile. Suspended accounts are denied on every authenticated request, and their refresh sessions are revoked when suspended.

To add another admin, send `POST /api/v1/auth/admin/register` with an existing admin's access token and the standard `fullName`, `email`, and `password` registration fields:

```sh
curl -X POST http://localhost:4000/api/v1/auth/admin/register \
  -H "Authorization: Bearer <admin-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"New Admin","email":"admin@example.com","password":"<strong-password>"}'
```

For local development with `ALLOW_DEV_ADMIN_REGISTRATION=true`, the same request can be sent without the `Authorization` header from the local machine:

```sh
curl -X POST http://localhost:4000/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Local Admin","email":"admin@example.com","password":"<strong-password>"}'
```

### Booking and scheduling workflow

Customers can check eligible providers for a requested service, address, package, add-ons, and offset-aware start time using `GET /api/v1/bookings/availability`. Creating a booking automatically assigns an eligible provider; assignment starts in `assigned` until the provider accepts. Providers can accept or reject, start the service, and mark it provider-completed. The customer must confirm completion before the booking enters `completed` and can be reviewed. Admins can manually assign pending bookings. Customers or admins can cancel or reschedule bookings that have not started; rescheduling checks availability again and requires provider acceptance.

Provider availability windows, coverage, verification, and overlapping active bookings are checked for every assignment. Provider rows are locked during assignment and slot checks happen in the same database transaction as booking changes to prevent concurrent assignments from double-booking a provider. `GET /api/v1/bookings/:bookingId/history` returns the status audit trail. Booking changes create persisted in-app notifications, available via `GET /api/v1/bookings/notifications`; users can mark them read with `PATCH /api/v1/bookings/notifications/:notificationId/read`. Notification delivery is in-app; email/SMS booking alerts require a delivery integration.

Password reset tokens and OTP codes are stored only as hashes, expire, and are one-time use; OTP verification is rate-limited and stops after five failed attempts. A password reset increments the account's auth version, immediately invalidating existing access tokens and refresh sessions. Email delivery uses the configured SMTP transport. Forgot-password always returns a generic acceptance message to avoid account enumeration; delivery failures are logged and the unusable token is discarded. OTP delivery failures return an explicit service error. This release implements email OTP only; SMS OTP requires an SMS delivery adapter.

Booking creation uses the effective service price for the selected address and `DEFAULT_CURRENCY`; payment collection and provider dispatch require their corresponding integrations/modules. When a provider is explicitly selected, the API checks their approval, service offering, local-time availability, and overlapping assigned bookings.

### Service catalog

Public catalog list endpoints accept `page` and `limit` (maximum 100). Service search supports `q`, `categoryId`, `cityId`, `areaId`, `minPrice`, `maxPrice`, `minDuration`, `maxDuration`, `sortBy` (`name`, `price`, `duration`, or `createdAt`), and `order` (`asc` or `desc`). Set both `cityId` and `areaId` when filtering or calculating prices for an area. Category and city list endpoints support text search; categories also support `parentId` and `includeSubcategories`.

All `/api/v1/catalog/admin/*` routes require the admin role. Admins can manage categories, services, packages, add-ons, pricing rules, cities, areas, and each service's available areas. Deleting catalog records deactivates them instead of removing records referenced by existing bookings. Service images are stored as validated URLs; upload and media storage are expected to be provided by a CDN/object-storage integration.

An active pricing rule can be global, city-specific, or area-specific. The most-specific applicable location wins, then higher priority, then the most recently created rule. `fixed` sets the final service price, `percentage` applies a percent increase over the base price, and `multiplier` multiplies the base price. Rules can have start/end times; the same calculation is used for catalog price filtering, detail responses, and booking creation. A selected package replaces the service base price, while selected add-ons contribute additional price and duration; booking records retain name, price, and duration snapshots.

## Database

Migrations live in `src/database/migrations`, seeders in `src/database/seeders`, and model definitions/associations in `src/models`. Use migrations for schema changes; do not use `sequelize.sync()` in deployed environments.

The schema includes users, roles and user-role assignments, addresses, service categories and subcategories, services, cities and areas, service images/packages/add-ons/pricing rules/availability, providers and provider coverage, provider documents and working hours, provider service offerings, bookings and selected-option snapshots, payments, commissions, reviews, refresh sessions, password reset tokens, and OTP challenges. Foreign keys, uniqueness constraints, and query indexes are declared in migrations. Expired token/challenge cleanup should be scheduled as an operational retention job.

### Provider onboarding and eligibility

Provider applications start pending. Providers maintain personal/professional details, select active services and coverage areas, and define non-overlapping weekly availability windows with an IANA timezone. Admin approval requires an active account, verified email, completed legal name/date-of-birth/professional-title fields, and the latest uploaded front and back identity documents to both be approved and unexpired. A replacement identity document immediately disables identity verification and takes an approved provider offline until the new documents are reviewed and the application is approved again.

Identity documents use private S3-compatible object storage. Configure `DOCUMENT_STORAGE_BUCKET` and `DOCUMENT_STORAGE_REGION`; optionally set `DOCUMENT_STORAGE_ENDPOINT` and the access-key/secret pair for S3-compatible services, plus `DOCUMENT_STORAGE_FORCE_PATH_STYLE` when required. Providers request a five-minute presigned PUT URL, upload with the returned `Content-Type`, then call the completion endpoint; the API verifies object size, declared MIME type, and JPEG/PNG/PDF file signatures before marking the document uploaded. Admin and owner downloads use short-lived signed URLs. The bucket should remain private, enable encryption at rest, and apply retention policies appropriate for identity data. Upload endpoints accept JPEG, PNG, or PDF files up to 10 MB.

Provider discovery only returns online, identity-verified, approved providers and can filter by service, city, and area. Assigned customer bookings independently verify the provider's active account, verified email, current identity documents, approval, online status, selected service, configured area coverage, working hours, and booking conflicts. Providers are forced offline when their user account is suspended. Public provider profiles omit legal identity details and show only professional data, working hours, service offerings, coverage, and published reviews. Customers can review only a completed booking with an assigned provider. Earnings are commission totals grouped by currency and settlement status; payment/payout processing is not implemented here.

## Structure

```text
config/                 Sequelize CLI configuration
src/
  config/               Environment, logger, database
  database/             Migrations and seeders
  middleware/           Authentication, authorization, validation, errors
  models/               Sequelize models and associations
  modules/               Domain-oriented MVC modules
  utils/                Shared API/error utilities
  app.js                 Express application
  server.js              Process startup and graceful shutdown
```
