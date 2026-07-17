# PlantBrain AI — Security Review Record

Every push to the remote is gated by an independent security-review pass (Opus, high
effort) over the diff. This records the posture across the build.

## Process
- Security review before **every** push; fix → re-review until clean.
- `pip-audit` on `requirements.txt` and the installed environment each interval.
- Secrets only in gitignored `.env`; verified with `git grep` that no key/credential
  is in the tracked tree.

## Findings found & fixed
| Interval | Finding | Resolution |
|---|---|---|
| 0 | `python-multipart` / `starlette` DoS CVEs on the upload path | Bumped fastapi→0.139, starlette→1.3.1, python-multipart→0.0.31 |
| 0 | Unbounded read before size check in upload | Chunked read, 413 as soon as the limit is exceeded |
| 1 | `pypdf` 5.1.0 (31 CVEs) | Bumped to 6.13.3 |
| 2 | **`pdfminer.six` PDF-pickle RCE** (via pdfplumber) reachable from upload→ingest | Removed pdfplumber entirely; PDF tables now via PyMuPDF |
| 2 | `pillow` image-decoder CVEs | Bumped to 12.3.0 (moved fastembed 0.7.4→0.8.0) |

## Controls verified clean (per interval)
- **Secret hygiene:** `.env` (DB password + Groq key) untracked/gitignored; no `gsk_`
  or password fragment anywhere in the tracked tree.
- **SQL:** ORM + bound `text()` params throughout; pgvector literals are model-produced
  floats; no string-built SQL.
- **Upload:** content-type allowlist, size-bounded chunked read, server-generated
  storage name (no traversal), SHA-256, no execution.
- **LLM:** key sent only in the Authorization header to the configured HTTPS base URL,
  never logged; no SSRF (URL is operator-configured); prompt-injection guardrail +
  detection/logging; no-source-no-answer; citation indices bounds-checked; no eval/exec.
- **Dependencies:** `pip-audit` → "No known vulnerabilities found."
- **Tests:** hermetic (in-memory SQLite), never touch the hosted Postgres.

## Current status
Latest `pip-audit`: **no known vulnerabilities**. No open findings.
