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

4. Remove bootstrap admin credentials from `.env` after the seeder succeeds. The seeder refuses to add the admin role to an existing non-admin account. Admins have no public registration endpoint.
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
| POST | `/api/v1/auth/login` | Public | Customer login |
| POST | `/api/v1/auth/provider/login` | Public | Provider login |
| POST | `/api/v1/auth/admin/login` | Public | Admin login; only provisioned admins can use it |
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

Customer registration only grants the customer role. Provider registration only grants the provider role and creates a provider profile in pending approval. Admin role assignment is only available to the controlled bootstrap seeder; there is no public admin registration. Login endpoints enforce the expected role. Use `authorize` for general role checks, `authorizeExclusive` for provider/admin-only surfaces, and `requireApprovedProvider` for operations that require an approved provider profile. Suspended accounts are denied on every authenticated request, and their refresh sessions are revoked when suspended.

Password reset tokens and OTP codes are stored only as hashes, expire, and are one-time use; OTP verification is rate-limited and stops after five failed attempts. A password reset increments the account's auth version, immediately invalidating existing access tokens and refresh sessions. Email delivery uses the configured SMTP transport. Forgot-password always returns a generic acceptance message to avoid account enumeration; delivery failures are logged and the unusable token is discarded. OTP delivery failures return an explicit service error. This release implements email OTP only; SMS OTP requires an SMS delivery adapter.

Booking creation uses the effective service price for the selected address and `DEFAULT_CURRENCY`; payment collection and provider dispatch require their corresponding integrations/modules. When a provider is explicitly selected, the API checks their approval, service offering, local-time availability, and overlapping assigned bookings.

### Service catalog

Public catalog list endpoints accept `page` and `limit` (maximum 100). Service search supports `q`, `categoryId`, `cityId`, `areaId`, `minPrice`, `maxPrice`, `minDuration`, `maxDuration`, `sortBy` (`name`, `price`, `duration`, or `createdAt`), and `order` (`asc` or `desc`). Set both `cityId` and `areaId` when filtering or calculating prices for an area. Category and city list endpoints support text search; categories also support `parentId` and `includeSubcategories`.

All `/api/v1/catalog/admin/*` routes require the admin role. Admins can manage categories, services, packages, add-ons, pricing rules, cities, areas, and each service's available areas. Deleting catalog records deactivates them instead of removing records referenced by existing bookings. Service images are stored as validated URLs; upload and media storage are expected to be provided by a CDN/object-storage integration.

An active pricing rule can be global, city-specific, or area-specific. The most-specific applicable location wins, then higher priority, then the most recently created rule. `fixed` sets the final service price, `percentage` applies a percent increase over the base price, and `multiplier` multiplies the base price. Rules can have start/end times; the same calculation is used for catalog price filtering, detail responses, and booking creation. A selected package replaces the service base price, while selected add-ons contribute additional price and duration; booking records retain name, price, and duration snapshots.

## Database

Migrations live in `src/database/migrations`, seeders in `src/database/seeders`, and model definitions/associations in `src/models`. Use migrations for schema changes; do not use `sequelize.sync()` in deployed environments.

The schema includes users, roles and user-role assignments, addresses, service categories and subcategories, services, cities and areas, service images/packages/add-ons/pricing rules/availability, providers, provider documents, provider availability and service offerings, bookings and selected-option snapshots, payments, commissions, reviews, refresh sessions, password reset tokens, and OTP challenges. Foreign keys, uniqueness constraints, and query indexes are declared in migrations. Expired token/challenge cleanup should be scheduled as an operational retention job.

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
