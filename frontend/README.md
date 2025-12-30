# Beyla Sandbox Frontend

A responsive Next.js 14 + Tailwind dashboard for the Beyla sandbox API. The app is tuned for mobile and desktop layouts, surfaces balances, transactions, alerts, audit evidence links, and the synthetic NayaOne dataset exposed by the backend proxy, and now authenticates via the Cognito Hosted UI flow.

## Prerequisites

- Node.js 20+
- npm 10+
- Access to the Beyla sandbox API

## Getting started

1. Copy `.env.example` to `.env.local` and set the environment variables for your API base URL and Cognito Hosted UI configuration.
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the Cognito login screen.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the sandbox API (e.g. `http://localhost:8080`). |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito Hosted UI domain (e.g. `https://your-domain.auth.eu-west-2.amazoncognito.com`). |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito app client ID. |
| `NEXT_PUBLIC_COGNITO_REDIRECT_URI` | URL Cognito redirects back to after sign-in (e.g. `http://localhost:3000/auth/callback`). |

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
