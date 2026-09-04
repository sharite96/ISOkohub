# IsokoHub — Connected Cloudflare Package

This folder contains the IsokoHub frontend plus a Cloudflare Pages Functions API connected to Cloudflare D1 and R2.

## Folder
```text
IsokoHub/
├── index.html
├── schema.sql
├── migration_auth.sql
├── wrangler.toml
├── README.md
└── functions/
    └── api/
        └── [[path]].js
```

## What is connected
- D1 database API for products, services, users, orders, messages and reviews
- Register/login sessions (server-side session token hash)
- Product and service creation
- Product/service search
- Orders and order items
- Messages
- Reviews
- R2 image upload and image retrieval
- Admin statistics and approval endpoints
- Health/config endpoints

## Cloudflare setup
1. Put this folder's contents in the GitHub repository root.
2. In Cloudflare Pages, connect that repository.
3. Framework preset: None.
4. Build command: leave empty.
5. Build output directory: `.` / repository root.
6. Create a D1 database named `isokohub-db`.
7. Run `schema.sql` in D1.
8. If your existing D1 schema lacks `password_hash` and `session_token_hash`, run `migration_auth.sql`.
9. Create an R2 bucket named `isokohub-images`.
10. Bind D1 as `DB` and R2 as `IMAGES`.
11. Set a secret named `AUTH_PEPPER` to a long random value.
12. Replace `database_id` in `wrangler.toml` with your real D1 database ID if you deploy with Wrangler.

## Admin
Do not use a public hard-coded admin password. Create a normal account, then promote its role to `admin` in D1 after verifying the account:
```sql
UPDATE users SET role='admin' WHERE email='YOUR_ADMIN_EMAIL';
```
Keep the admin email private.

## Payments
Payment cannot be genuinely activated without YOUR merchant account and secret credentials. The API returns payment capability status through `/api/config`, and orders are created as `unpaid`. Add your chosen payment provider's server-side API and webhook credentials as Cloudflare Secrets; never put them in `index.html`.

## Important
The package is the connected technical foundation, but Cloudflare resources and private payment credentials belong to your account. Do not paste API tokens or payment secrets into public GitHub files.
