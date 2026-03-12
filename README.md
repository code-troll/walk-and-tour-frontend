# Walk and Tour Frontend

This project is a Next.js app with two runtime entry modes:

- Public site: any non-admin hostname
- Backoffice: `admin.walkandtour.dk`, `admin.staging.walkandtour.dk`, or `admin.dev.walkandtour.dk`

The admin area is resolved internally through `app/admin`, but it is only activated when the request hostname matches one of the admin subdomains.

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Using `--hostname 0.0.0.0` makes the dev server reachable through custom local hostnames defined in your hosts file.

## Local Domains

For local development:

- Public site should use `dev.walkandtour.dk`
- Backoffice should use `admin.dev.walkandtour.dk`

Recommended local URLs:

- Public site: `http://dev.walkandtour.dk:3000`
- Backoffice: `http://admin.dev.walkandtour.dk:3000`

## Hosts File Setup

Add these entries to your local hosts file:

```text
127.0.0.1 dev.walkandtour.dk
127.0.0.1 admin.dev.walkandtour.dk
```

You can also map the other admin hostnames if you want to test them locally:

```text
127.0.0.1 admin.walkandtour.dk
127.0.0.1 admin.staging.walkandtour.dk
```

Be careful with those two entries because they override the real DNS resolution on your machine while they are present.

## macOS

Edit `/etc/hosts` as administrator:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 dev.walkandtour.dk
127.0.0.1 admin.dev.walkandtour.dk
```

Save the file, then flush DNS:

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

Then open:

- `http://dev.walkandtour.dk:3000`
- `http://admin.dev.walkandtour.dk:3000`

## Linux

Edit `/etc/hosts` as root:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 dev.walkandtour.dk
127.0.0.1 admin.dev.walkandtour.dk
```

In most Linux distributions, the change is available immediately. If needed, restart the resolver or NetworkManager.

Then open:

- `http://dev.walkandtour.dk:3000`
- `http://admin.dev.walkandtour.dk:3000`

## Windows

Open Notepad as Administrator and edit:

```text
C:\Windows\System32\drivers\etc\hosts
```

Add:

```text
127.0.0.1 dev.walkandtour.dk
127.0.0.1 admin.dev.walkandtour.dk
```

Then flush DNS in an elevated Command Prompt:

```bat
ipconfig /flushdns
```

Then open:

- `http://dev.walkandtour.dk:3000`
- `http://admin.dev.walkandtour.dk:3000`

## Notes

- `localhost:3000` will work for the public site, but not for the admin hostname-based routing.
- `/admin` on a public hostname is intentionally not valid.
- The admin route tree is server-side guarded, so only the configured admin hostnames can render `app/admin`.

## Environment Variables

Copy `.env.template` into `.env` and then add the remaining values used by the admin API and Auth0 integration:

```bash
cp .env.template .env
```

The app currently uses three groups of environment variables:

### Admin API and Auth0

These are needed for the new backoffice under `admin.*`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `BACKEND_API_BASE_URL` | Yes for admin API | Base URL of the backend API, without a trailing slash. Example: `https://api.dev.walkandtour.dk` |
| `AUTH0_DOMAIN` | Yes for admin login | Auth0 tenant domain used by the Next frontend |
| `AUTH0_CLIENT_ID` | Yes for admin login | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Yes for admin login | Auth0 application client secret for the regular web app |
| `AUTH0_SECRET` | Yes for admin login | Cookie/session encryption secret used by `@auth0/nextjs-auth0` |
| `BACKEND_AUTH0_AUDIENCE` | Recommended | Auth0 API audience used to request the backend bearer token sent to `/api/admin/*` |
| `AUTH0_AUDIENCE` | Optional fallback | Used only if `BACKEND_AUTH0_AUDIENCE` is not set |
| `APP_BASE_URL` | Optional | Allowed frontend app base URL(s) for Auth0. For this project it can be a comma-separated list, for example: `http://dev.walkandtour.dk:3000,http://admin.dev.walkandtour.dk:3000` |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Optional fallback | Public fallback for backend base URL resolution. Prefer `BACKEND_API_BASE_URL` when possible |

Notes:

- The admin UI is considered configured only when `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, and `AUTH0_SECRET` are present.
- `BACKEND_API_BASE_URL` is the main backend URL used by the typed API clients and internal admin BFF routes.
- `APP_BASE_URL` is optional because the Auth0 SDK can infer the origin from the incoming request host, but setting it is safer when you want explicit allowed origins.

### Public site blog integration (current implementation)

These are used by the current public blog integration that still talks to Wix:

| Variable | Required | Purpose |
| --- | --- | --- |
| `WIX_API_KEY` | Yes for blog features | Wix API key used for blog content, comments, and metrics |
| `WIX_SITE_ID` | Yes for blog features | Wix site identifier sent in Wix API requests |
| `WIX_BLOG_SITE_BASE_URL` | Optional | Base public blog URL used when building post URLs from slugs |
| `WIX_BLOG_QUERY_URL` | Optional | Override for the Wix posts query endpoint |
| `WIX_BLOG_POST_BY_SLUG_BASE_URL` | Optional | Override for the Wix post-by-slug endpoint |
| `WIX_BLOG_METRICS_BASE_URL` | Optional | Override for Wix blog metrics/read endpoints |
| `WIX_COMMENTS_ENDPOINT` | Optional | Override for the Wix comments endpoint |
| `WIX_BLOG_COMMENTS_APP_ID` | Optional | Override for the Wix blog comments app ID |
| `WIX_BLOG_READ_ENDPOINT` | Optional | Endpoint template for notifying Wix that a post was read. Supports `{postId}` and `{slug}` placeholders |

If you are only working on the admin shell and not on the existing public blog pages, the Wix variables can be omitted, but the current public blog routes will not work.

### Forms and email delivery

These are used by the public contact and book-tour forms:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes for forms | Cloudflare Turnstile site key exposed to the browser |
| `TURNSTILE_SECRET_KEY` | Yes for forms | Server-side Turnstile secret used to validate submissions |
| `RESEND_API_KEY` | Yes for forms | Resend API key used to send contact and booking emails |
| `BOOKING_REQUEST_FROM_EMAIL` | Yes for booking form | Sender address for booking-request emails |
| `BOOKING_REQUEST_TO_EMAIL` | Yes for booking form | Recipient address for booking-request emails |
| `CONTACT_FORM_FROM_EMAIL` | Optional | Sender address for contact-form emails. Falls back to `BOOKING_REQUEST_FROM_EMAIL` |
| `CONTACT_FORM_TO_EMAIL` | Optional | Recipient address for contact-form emails. Falls back to `BOOKING_REQUEST_TO_EMAIL` |

### Minimal local setup for the backoffice

If you only want the admin area working locally, the minimum practical set is:

```env
BACKEND_API_BASE_URL=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=
BACKEND_AUTH0_AUDIENCE=
APP_BASE_URL=http://dev.walkandtour.dk:3000,http://admin.dev.walkandtour.dk:3000
```

### Minimal local setup for the existing public site

If you want the current public blog and forms to work as well, also add:

```env
WIX_API_KEY=
WIX_SITE_ID=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
BOOKING_REQUEST_FROM_EMAIL=
BOOKING_REQUEST_TO_EMAIL=
```

## Build

Run a production build with:

```bash
npm run build
```
