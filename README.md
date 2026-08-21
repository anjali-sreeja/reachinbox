# ReachInbox – Email Scheduling & Outbound Automation

A production-grade, distributed cold email scheduling platform built with TypeScript, Node.js, Express, PostgreSQL, Prisma ORM, Redis, BullMQ, and Nodemailer (Ethereal SMTP).

---

## 🏗 Architecture & Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Express API Server                     │
│   POST /api/emails/schedule                                 │
│   • Validates payload (Zod)                                 │
│   • Persists Email entity in PostgreSQL (status=SCHEDULED)  │
│   • Adds delayed job to BullMQ with jobId = email.id        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Redis Persistence Layer                    │
│   • BullMQ Delayed Queue (ZSET scored by target timestamp)  │
│   • Atomic Hourly Rate Limiter (Hour-Window Keys)           │
│   • Multi-Worker Coordination & Send Slot Reservation       │
│   • Survives server & container restarts (AOF sync)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BullMQ Worker Pool                        │
│   • Configurable concurrency (WORKER_CONCURRENCY=5)         │
│   • Distributed Minimum Send Delay (MIN_EMAIL_DELAY_MS=2000)│
│   • Distributed Hourly Rate Limit (MAX_EMAILS_PER_HOUR=200) │
│   • Non-destructive rescheduling on rate limit breach       │
│   • Idempotency enforcement & state transition management   │
│   • Nodemailer + Ethereal SMTP delivery & preview URLs      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Distributed Hourly Rate Limiting Design (`MAX_EMAILS_PER_HOUR`)

### 1. Algorithm: Redis Atomic Hour-Window
- **Key Structure**: `ratelimit:hourly:{senderId}:{epochHour}`
  - Where `epochHour = Math.floor(Date.now() / 3600000)`.
  - Keys automatically expire after 2 hours (`TTL = 7200s`).
- **Atomic Lua Script** (`src/services/rateLimiter.service.ts`):
  ```lua
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local maxLimit = tonumber(ARGV[2])
  local windowSizeMs = tonumber(ARGV[3])
  local ttl = tonumber(ARGV[4])

  local current = redis.call('GET', key)
  local count = current and tonumber(current) or 0

  if count < maxLimit then
      local newCount = redis.call('INCR', key)
      if newCount == 1 then
          redis.call('EXPIRE', key, ttl)
      end
      return {1, 0, newCount}
  else
      local currentWindow = math.floor(now / windowSizeMs)
      local nextWindowStart = (currentWindow + 1) * windowSizeMs
      local waitMs = nextWindowStart - now
      if waitMs < 1000 then waitMs = 1000 end
      return {0, waitMs, count}
  end
  ```

### 2. Non-Destructive Rescheduling
- When a sender reaches `MAX_EMAILS_PER_HOUR` (e.g. 200 emails/hour):
  - **Does NOT fail the email**: Database status remains `SCHEDULED`.
  - **Does NOT drop the job**: The worker moves the BullMQ job back to the `delayed` state (`job.moveToDelayed(nextWindowTimestamp)`).
  - Calculates milliseconds until the exact start of the next hour window:
    $$\Delta t = (\lfloor \frac{\text{now}}{3600000} \rfloor + 1) \times 3600000 - \text{now}$$
  - Updates `scheduledAt` in PostgreSQL and pauses execution.

### 3. Example Scenario: 1,000 Emails Scheduled at 2:00 PM (`MAX_EMAILS_PER_HOUR=200`)
- **2:00 PM – 2:59 PM**: First 200 emails sent (spaced by `MIN_EMAIL_DELAY_MS`). Email #201 hits the hourly cap and is delayed to 3:00 PM.
- **3:00 PM – 3:59 PM**: Next 200 emails (#201 to #400) automatically resume and send.
- **4:00 PM – 4:59 PM**: Next 200 emails (#401 to #600) sent.
- **5:00 PM – 5:59 PM**: Next 200 emails (#601 to #800) sent.
- **6:00 PM – 6:59 PM**: Final 200 emails (#801 to #1000) sent.

### 4. Trade-Offs & Design Decisions
| Decision | Benefit | Trade-off |
|---|---|---|
| **Fixed Hour-Window with Atomic Lua** | Zero race conditions across multiple worker processes; $O(1)$ lookup time. | Slight burst potential at boundary switch (mitigated by `MIN_EMAIL_DELAY_MS`). |
| **Non-Destructive BullMQ Delay** | Failed rate limits don't pollute retry counts or corrupt email statuses. | Requires workers to acknowledge postponement cleanly via `moveToDelayed`. |
| **Redis-Backed State** | Multiple containers/instances share exact sender limits. | Requires Redis availability (fails safe if transient connection error). |

---

## ⚡ Concurrency & Distributed Minimum Send Delay (`MIN_EMAIL_DELAY_MS`)

### 1. Configurable Worker Concurrency
- Configured via `WORKER_CONCURRENCY` in `.env` (e.g. `WORKER_CONCURRENCY=5`).
- BullMQ worker spawns parallel job executors within the same process or across multiple horizontal worker instances.

### 2. Multi-Process Safe Minimum Send Delay
- Solution: **Redis Atomic Timeslot Reservation** (`src/services/delayCoordinator.service.ts`).
- When concurrent jobs trigger simultaneously at $T=0$:
  - Worker 1 receives wait time $0\text{ ms} \to$ sends immediately at $T=0$.
  - Worker 2 receives wait time $2000\text{ ms} \to$ waits and sends at $T=2000\text{ ms}$.
  - Worker 3 receives wait time $4000\text{ ms} \to$ waits and sends at $T=4000\text{ ms}$.
- **Zero in-memory global state**: State is isolated and synchronized in Redis.
- **No cron or polling timers**: Relies entirely on event-driven BullMQ jobs and Redis atomic slot coordination.

---

## 🛡 Fault Tolerance & Restart Durability

1. **BullMQ Delayed Jobs**: Delayed jobs reside in Redis Sorted Sets (`ZSET`). If the server or worker crashes, the jobs remain safely on disk in Redis (`appendonly yes`).
2. **Deterministic Job IDs & Idempotency**:
   - `jobId: email.id` prevents duplicate job creation in BullMQ.
   - The worker verifies `email.status !== SENT` before execution to prevent double sending.

---

## 🚀 Getting Started

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Configure Environment
Copy `.env.example` to `.env` in `apps/backend/`:
```bash
cp apps/backend/.env.example apps/backend/.env
```

### 3. Run Migrations & Start Backend
```bash
cd apps/backend
npm install
npx prisma migrate dev
npm run dev
```

### 4. API Endpoints
- `GET /health` – System & DB health check
- `POST /api/emails/schedule` – Schedule a new email
- `GET /api/emails/scheduled` – List scheduled/processing emails
- `GET /api/emails/sent` – List sent emails with timestamps
