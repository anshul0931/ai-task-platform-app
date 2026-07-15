# AI Task Processing Platform — Application Repository

MERN + Python worker application implementing async AI-style text task
processing (Uppercase, Lowercase, Reverse String, Word Count) with JWT auth
and real-time status updates.

## Services

| Service  | Tech                          | Responsibility                                  |
|----------|--------------------------------|--------------------------------------------------|
| frontend | React 18 + Vite, nginx (prod) | Auth UI, task submission, live status + logs      |
| backend  | Node 20 + Express, Socket.io   | REST API, JWT auth, enqueues jobs, emits updates |
| worker   | Python 3.12                    | Consumes queue, runs the operation, reports back |
| mongo    | MongoDB 7                      | Users + tasks persistence                         |
| redis    | Redis 7                        | Job queue (`LPUSH`/`BRPOP` list)                  |

See `../ARCHITECTURE.md` for the full system design, scaling strategy, and
failure-handling discussion.

## Local development

```bash
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Running without Docker (optional, for active development)

```bash
# Terminal 1 — Mongo & Redis only
docker compose up mongo redis

# Terminal 2 — backend
cd backend && npm install && npm run dev

# Terminal 3 — worker
cd worker && pip install -r requirements.txt && python worker.py

# Terminal 4 — frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

## API summary

| Method | Route                        | Auth         | Description                    |
|--------|-------------------------------|--------------|----------------------------------|
| POST   | `/api/auth/register`           | -            | Create account                  |
| POST   | `/api/auth/login`               | -            | Login, returns JWT              |
| GET    | `/api/auth/me`                   | JWT          | Current user profile            |
| POST   | `/api/tasks`                     | JWT          | Create + enqueue a task          |
| GET    | `/api/tasks`                      | JWT          | List own tasks (paginated)       |
| GET    | `/api/tasks/:id`                   | JWT          | Get single task (incl. logs)      |
| DELETE | `/api/tasks/:id`                    | JWT          | Delete a task                     |
| PATCH  | `/api/tasks/:id/status`              | Internal key | Worker reports status/logs/result |
| GET    | `/api/health`                        | -            | Liveness/readiness for probes      |

**Task payload:** `{ "title": "...", "inputText": "...", "operation": "uppercase" | "lowercase" | "reverse-string" | "word-count" }`

## Security

- Passwords hashed with bcrypt; JWT-based auth for users.
- `helmet` middleware and `express-rate-limit` (300 req/15min per IP on
  `/api/*`) enabled.
- Worker→backend status updates protected by a separate internal API key
  (`x-internal-api-key` header), never exposed to the browser.
- No secrets committed — `.env.example` files only; real `.env` files are
  gitignored. Kubernetes deployment uses `Secret`/`ConfigMap` objects (see
  the infrastructure repository) instead of hardcoded values.
- All containers (see each service's `Dockerfile`) run as non-root users via
  multi-stage builds.

## CI/CD (`.github/workflows/ci-cd.yaml`)

1. **Lint** — `eslint` for the backend, `flake8` for the worker.
2. **Build** — Docker images for `backend`, `worker`, `frontend`.
3. **Push** — images pushed to GHCR (`ghcr.io/<org>/ai-task-<service>`),
   tagged with both `latest` and the commit SHA. Swap the `login-action`
   registry/credentials to push to Docker Hub instead, if preferred.
4. **GitOps hand-off** — checks out the *infrastructure repository* (via
   `INFRA_REPO_PAT` secret), bumps image tags in its `k8s/*.yaml`, and
   commits/pushes there. ArgoCD (configured in the infra repo) then
   auto-syncs the cluster to match.
