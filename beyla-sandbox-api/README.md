# Beyla Sandbox API

TypeScript Express application serving the sandbox endpoints used by the Beyla agent experience. The service stores operational data in PostgreSQL and writes structured evidence to S3 with optional fan-out to SNS/SQS for observability consumers.

## Features

- Health, balances, transactions, and alerts endpoints.
- Open endpoints for balances, transactions, alerts, and dataset exploration (no authentication required in the sandbox).
- Request correlation IDs, pino structured logging, and configurable rate limiting.
- Evidence writer storing JSON payloads in S3 and mirroring metadata to PostgreSQL + SNS.
- SQL migrations and seed script for synthetic sandbox data.
- Dockerfile for multi-stage production builds.
- Optional proxy endpoint for the NayaOne synthetic UK business dataset with offset-based pagination.

## Local development

1. Start the local PostgreSQL instance via Docker (this repository includes a ready-to-use Compose file):

   ```bash
   docker compose up -d db
   ```

   The container exposes port `5432` to the host so the Node process can reach it at `postgres://postgres:postgres@localhost:5432/beyla`.

2. Install dependencies and bootstrap the service:

   ```bash
   npm install
   cp .env.example .env
   # update AWS credentials and overrides if needed
   npm run migrate
   npm run seed
   npm run dev
   ```

3. When finished developing, tear down the database container (preserving data in the named volume):

   ```bash
   docker compose down
   ```

### Accessing the NayaOne synthetic dataset

The API exposes a lightweight proxy to the NayaOne Corporate Account Hub dataset at `GET /datasets/nayaone`. Configure the
following environment variables when running locally or in the cloud:

- `NAYAONE_API_KEY` – your NayaOne sandpit API key (required).
- `NAYAONE_API_URL` – override for the dataset endpoint (defaults to `https://data.nayaone.com/cah_synth_data`).

Example request:

```bash

curl "http://localhost:8080/datasets/nayaone?offset=0"
```

The endpoint enforces offsets as non-negative multiples of 10 per the sandpit API contract. Responses include `records`
containing the upstream payload, the `pageSize` returned by NayaOne, and a `nextOffset` value when more data is available.

## Scripts

- `npm run migrate` – apply SQL migrations in `src/db/migrations` using the configured database.
- `npm run seed` – insert demo account/balance/transaction/alert data.
- `npm run build` – compile TypeScript to `dist/`.
- `npm run start` – run the compiled JavaScript build (used in production containers).

## Evidence format

Evidence entries follow the envelope below and are written to S3 using keys such as `env=dev/date=2024-09-15/corr=<uuid>/event-<iso>.json`.

```json
{
  "correlation_id": "uuid",
  "actor": {"type":"user","id":"user-123"},
  "action": "transaction.create",
  "request": {"path":"/transactions","body":{}},
  "response": {"status":201,"body":{}},
  "explain": "Created intent",
  "ts": "2024-09-15T12:34:56Z",
  "service": "sandbox-api",
  "ip": "127.0.0.1"
}
```
