# Beyla Sandbox Frontend

A responsive Next.js 14 + Tailwind dashboard for the Beyla sandbox API. The app integrates with an AWS Cognito Hosted UI for authentication and surfaces balances, transactions, alerts, audit evidence links, and the synthetic NayaOne dataset exposed by the backend proxy.

## Prerequisites

- Node.js 20+
- npm 10+
- Access to the Beyla sandbox API and Cognito user pool

## Getting started

1. Copy `.env.example` to `.env.local` and set the environment variables for your API base URL and Cognito user pool details.
   - For developer-only testing you can set `NEXT_PUBLIC_ADMIN_API_KEY` to match the API's `ADMIN_API_KEY`. The UI will
     automatically attach the key to requests and skip the Cognito login screen.
   - For quick local smoke tests you can flip `NEXT_PUBLIC_ENABLE_MOCK_AUTH` to `true` to bypass Cognito and sign in with a mock sandbox user.
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. On first load you will be redirected to the Cognito Hosted UI for sign-in.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the sandbox API (e.g. `http://localhost:8080`). |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito Hosted UI domain (without protocol). |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito app client ID. |
| `NEXT_PUBLIC_COGNITO_REDIRECT_URI` | URL Cognito redirects back to after sign-in (must be whitelisted). |
| `NEXT_PUBLIC_COGNITO_LOGOUT_URI` | URL Cognito redirects back to after logout. |
| `NEXT_PUBLIC_COGNITO_REGION` | AWS region of the Cognito user pool. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito user pool identifier (used for token audience validation). |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Shared admin key for local-only development. When set, the UI auto-authenticates and adds the key to API calls. |
| `NEXT_PUBLIC_ENABLE_MOCK_AUTH` | When `true`, bypasses Cognito and issues a mock session for local development. |
| `NEXT_PUBLIC_MOCK_USER_EMAIL` | Email shown for the mock session (if mock auth enabled). |
| `NEXT_PUBLIC_MOCK_USER_NAME` | Display name for the mock session (if mock auth enabled). |

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

- Login via Cognito Hosted UI.
- View balances and recent transactions on the dashboard.
- Create a synthetic transaction and observe it in the list.
- Review alerts with status badges.
- Open an audit evidence link for a selected alert.
- Browse the NayaOne dataset page and load additional records via the offset-driven API proxy.

