# Beyla Sandbox Frontend

A responsive Next.js 14 + Tailwind dashboard for the Beyla sandbox API. The app is tuned for mobile and desktop layouts, surfaces balances, transactions, alerts, audit evidence links, and the synthetic NayaOne dataset exposed by the backend proxy, and now runs without requiring Cognito authentication for local sandbox testing.

## Prerequisites

- Node.js 20+
- npm 10+
- Access to the Beyla sandbox API

## Getting started

1. Copy `.env.example` to `.env.local` and set the environment variables for your API base URL and optional display metadata.
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard will load immediately without a sign-in flow.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the sandbox API (e.g. `http://localhost:8080`). |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | *(Optional)* Cognito Hosted UI domain reserved for future secure deployments. |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | *(Optional)* Cognito app client ID. |
| `NEXT_PUBLIC_COGNITO_REDIRECT_URI` | *(Optional)* URL Cognito redirects back to after sign-in. |
| `NEXT_PUBLIC_COGNITO_LOGOUT_URI` | *(Optional)* URL Cognito redirects back to after logout. |
| `NEXT_PUBLIC_COGNITO_REGION` | *(Optional)* AWS region of the Cognito user pool. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | *(Optional)* Cognito user pool identifier. |
| `NEXT_PUBLIC_SANDBOX_USER_EMAIL` | Email shown in the header while running without Cognito. |
| `NEXT_PUBLIC_SANDBOX_USER_NAME` | Display name shown in the header while running without Cognito. |

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Runs the development server. |
| `npm run build` | Creates a production build. |
| `npm run start` | Starts the Next.js production server. |
| `npm run lint` | Runs Next.js linting. |

## Project structure

```
frontend/
  app/
  components/
  lib/
  public/
```

- `app/` — App Router routes for dashboard, transactions, alerts, datasets, and settings.
- `components/` — Shared UI primitives (buttons, cards, modal) and feature components.
- `lib/` — Auth context, Cognito utilities, and API client.

## Deployment

The frontend is optimized for deployment on Vercel or AWS CloudFront. Build the app with `npm run build` and serve the `.next` output via your preferred hosting provider. When deploying alongside the backend on ECS Fargate, configure the task definition with the same environment variables referenced above.

## Demo checklist

- Load the dashboard without authentication.
- View balances and recent transactions on the dashboard.
- Create a synthetic transaction and observe it in the list.
- Review alerts with status badges.
- Open an audit evidence link for a selected alert.
- Browse the NayaOne dataset page and load additional records via the offset-driven API proxy.

