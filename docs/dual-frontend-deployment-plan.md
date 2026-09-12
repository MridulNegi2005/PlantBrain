# PlantBrain dual-frontend deployment plan

Status: partially implemented — frontend and API are deployed; remote PostgreSQL connection, teammate CORS, corpus ingestion, and production hardening remain.

Date: 2026-09-13

## Recommended topology

```text
plantbrain.mridulnegi.dev       ─┐
<teammate-frontend-host>        ─┼─ Cloudflare frontend projects
                                 │
<api-host>                    ──┴─ (optional Cloudflare proxy) ── Oracle VM / Nginx ── FastAPI :8000
                                                               │
                                                     Remote PostgreSQL + pgvector
```

`plantbrain.mridulnegi.dev` is a valid and sensible hostname. The teammate should use a different hostname, for example `plantbrain-<name>.mridulnegi.dev`, or a hostname in their own domain. Both frontends can use the same API origin.

## What the repository currently does

The current checkout is `main` at the deployment commit. The frontend Worker and Oracle API have been deployed and verified.

- `frontend/` is a Next.js 16 App Router application with server-rendered pages and client workbenches. It uses `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run test`, and `npm run typecheck`.
- `frontend/src/lib/api/client.ts` builds every request as `${NEXT_PUBLIC_API_URL}${path}`. The production value must therefore be the API origin only, without `/api`, for example `https://<api-host>`.
- `frontend/.env.example` currently defaults to `http://localhost:8000`; there is no production example or Cloudflare configuration in the checkout.
- `frontend/next.config.ts` sets response security headers but has no Cloudflare adapter, `output: "export"`, rewrite, or proxy configuration. Because pages fetch data in server components and workbenches fetch from the browser, `output: "export"` must not be added blindly.
- `backend/app/main.py` already installs `CORSMiddleware`, but it reads `CORS_ORIGINS` from settings. `allow_credentials=True`, all methods, and all headers are currently enabled.
- `backend/app/core/config.py` defaults `CORS_ORIGINS` to `http://localhost:3000`, and `.env.example` has the same value. Production must list both exact HTTPS frontend origins, comma-separated, with no trailing slash.
- The backend has no reverse-proxy, systemd, Docker, Oracle, TLS, or health-monitoring files. `backend/Procfile` is Railway-oriented (`$PORT`).
- Uploaded files are stored below `backend/uploads/`; these files and the PostgreSQL database need separate backup and persistence treatment on the VM.
- The README now advertises `https://plantbrain.mridulnegi.dev` and `https://api.mridulnegi.dev/docs`.
- PostgreSQL is hosted on a separate server. The local PostgreSQL package on the Oracle VM is disabled; the API must be pointed at the existing database before production health checks can pass.
- The threat model records production auth, rate limiting, RBAC, and database hardening as not implemented. The public deployment must either remain an explicitly limited demo or add access control before exposing upload, evaluation, and audit routes.

## Minimal implementation changes

1. Add a frontend deployment example (likely `frontend/.env.production.example`) containing:

   ```text
   NEXT_PUBLIC_API_URL=https://<api-host>
   ```

   Configure that variable separately in each Cloudflare frontend project. Do not put a secret in a `NEXT_PUBLIC_` variable.

2. Keep `frontend/src/lib/api/client.ts` request paths unchanged. Confirm that the API value has no `/api` suffix and no trailing slash. This preserves the existing API contract for dashboard, upload, documents, assets, copilot, graph, RCA, compliance, evaluation, and audit routes.

3. Decide the existing Cloudflare runtime before changing Next configuration:

   - If the current project already runs Next server components through a Cloudflare Workers adapter, keep its working adapter and build command, and clone that project configuration for the teammate.
   - If it is a Pages static export, stop and resolve the incompatibility first: the current server components call the FastAPI API at request time. A static export would require a deliberate client-side refactor or a Workers runtime. Do not switch to `output: "export"` as a guess.
   - If a new Workers runtime is needed, use the current Cloudflare-supported Next.js path and validate it in a preview before changing the live project. Cloudflare currently recommends vinext for new Next.js-on-Workers applications; OpenNext is documented for existing OpenNext applications.

4. Update the backend production environment, not application behavior:

   ```text
   ENV=production
   DATABASE_URL=                         # leave empty when using POSTGRES_* assembly
   POSTGRES_DB=<existing-database>
   POSTGRES_USER=<database-user>
   POSTGRES_PASSWORD=<database-password>
   POSTGRES_HOST=<remote-postgres-host>
   POSTGRES_PORT=5432
   LLM_API_KEY=<provider-key>
   LLM_BASE_URL=https://api.groq.com/openai/v1
   LLM_MODEL=llama-3.3-70b-versatile
   JWT_SECRET=<long-random-secret>
   CORS_ORIGINS=https://plantbrain.mridulnegi.dev,https://<teammate-frontend-host>
   MAX_UPLOAD_MB=20
   ```

   Do not use the SQLite fallback, the default JWT secret, or a wildcard CORS origin in production. Allow the Oracle VM source IP (`144.24.125.218`) through the database server's firewall/allowlist. If the provider requires TLS, set `DATABASE_URL` with its required SSL parameters instead of using the assembled `POSTGRES_*` URL. Keep `.env` outside Git and restrict its permissions.

5. Add only the deployment files required after the Oracle runtime is selected: a systemd unit (or the chosen process supervisor), an Nginx or Caddy reverse-proxy configuration, a health-check/backup note, and a production runbook. Do not change API routes or database models for this split-host arrangement.

6. Add a small branding configuration for each frontend only if the teammate needs a distinct name/credit line. Keep shared product and team attribution accurate. The branding must not alter the API client, route names, or backend ownership claims. Candidate files are `frontend/src/app/layout.tsx`, `frontend/src/components/app-shell.tsx`, and a small public-safe brand configuration module; do not duplicate or fork backend logic.

## Oracle Cloud VM checklist

The Oracle VM is Ubuntu 22.04 on ARM64. The API runs under systemd as `plantbrain`, with Caddy already serving the VM.

1. Reserve a stable public IPv4 address. Record the OS, region, VM shape, and the address as deployment inventory.
2. A dedicated `plantbrain` service user is in use; SSH remains through the existing `ubuntu` account with sudo.
3. Python and the pinned `backend/requirements.txt` are installed. A local PostgreSQL package was used only for testing and is disabled; production uses the separate PostgreSQL server.
4. Clone the exact release, create `/srv/plantbrain/backend/uploads` (or another persistent path), and decide whether `UPLOAD_DIR` needs a small code/config change to move uploads out of the release tree. Back up both the database and uploaded files.
5. Copy production `.env` to the service host only. Verify network access and credentials to the remote database. Run `python -m scripts.db_bootstrap` only if the existing database is the intended PlantBrain target and the database user may create/alter the required schema; otherwise apply the provider-approved schema change and load/ingest the intended corpus. Verify `/health` before putting the proxy in front.
6. Run Uvicorn bound to `127.0.0.1:8000` under systemd with automatic restart and journald logs. Do not expose port 8000 publicly.
7. Put Nginx or Caddy on ports 80 and 443 with `server_name <api-host>`, proxying to `http://127.0.0.1:8000`. Preserve `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, request method, and upload body size (at least the configured 20 MB).
8. Allow only SSH, HTTP, and HTTPS in the Oracle security list and VM firewall. Keep PostgreSQL and Uvicorn private.
9. Issue a certificate for `<api-host>` using Let's Encrypt/Certbot or a Cloudflare Origin CA certificate. Configure Cloudflare SSL/TLS to Full (strict) only after the origin certificate matches the API hostname and port 443 works.
10. Verify `GET /health`, an allowed CORS preflight from each frontend, a rejected preflight from an unlisted origin, one read-only API request, one upload/ingestion flow, and the long-running copilot/RCA/evaluation timeout behavior.

## Cloudflare and Name.com checklist

The current DNS lookup shows `mridulnegi.dev` delegated to `kimora.ns.cloudflare.com` and `kevin.ns.cloudflare.com`. That means Cloudflare is authoritative. Name.com remains the registrar; DNS records should be managed in Cloudflare, not Name.com.

Completed for the owner frontend/API:

1. `plantbrain.mridulnegi.dev` is a proxied CNAME to the deployed Worker and a Worker route is attached.
2. `api.mridulnegi.dev` is an A record to `144.24.125.218`, currently DNS-only, with a valid Caddy-managed Let's Encrypt certificate.
3. Name.com was not changed; Cloudflare remains authoritative.
4. Add the teammate's exact frontend origin to `CORS_ORIGINS` after he supplies the domain, then restart `plantbrain.service`.

## Frontend build and ownership

Use two independently deployable frontend projects or two clearly isolated Cloudflare project configurations. Both build from the same shared application contract but have separate environment values for `NEXT_PUBLIC_API_URL` and separate public branding/attribution. The backend remains one Oracle service and one database.

The final attribution should say that the frontend is the relevant contributor's version, while PlantBrain remains a team project and the shared FastAPI/RAG backend credits remain accurate. Do not claim that one person owns the other person's frontend or that either frontend has a separate backend.

## Verification gate before any DNS or deployment action

- `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass with the production API origin.
- The chosen Cloudflare runtime serves every required App Router route; server-rendered pages and client workbenches both reach the Oracle API over HTTPS.
- The API returns a valid certificate and health response through `<api-host>`.
- CORS allows exactly the two frontend origins and rejects an unrelated origin.
- Browser checks cover dashboard, copilot, upload, document detail, asset detail, graph, RCA, compliance, evaluation, and audit pages, including error and timeout states.
- Uploads, background ingestion, logs, and database backups survive a service restart.
- Only after these checks pass should Cloudflare custom domains be attached or DNS records changed.
