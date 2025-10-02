# RProxy

RProxy is a Bun / Vercel-friendly proxy for Roblox API requests. Deploy it to serverless edge or run it locally with Bun.

## Features

- **Proxy for Roblox API**: Forward requests to Roblox's API with ease.
- **Security Key**: Validate incoming requests using a security key.
- **Configurable Timeout and Retries**: Set timeout duration and retry attempts for requests.
- **Vercel Deployment**: Deploy to Vercel Edge Functions or run via Bun locally.

## Environment Variables

- `PORT`: Local Bun server port. Default `3000`.
- `TIMEOUT`: Timeout in seconds for each outward request. Default `30`.
- `RETRIES`: Retry attempts before failing. Default `3`.
- `KEY`: Optional security key. Requests must include a `PROXYKEY` header when set.

## Deployment

### Vercel

1. Install dependencies: `bun install`
2. Link the project: `vercel link`
3. Deploy: `vercel deploy`

Configure these environment variables in Vercel (Project Settings → Environment Variables):

- `KEY`
- `TIMEOUT` (optional)
- `RETRIES` (optional)

Routes:

- Edge function `api/proxy` accepts paths of the form `/api/proxy/<subdomain>/<path>`. Example: `/api/proxy/users/v1/users/authenticated` → `https://users.roblox.com/v1/users/authenticated`

### Bun (local / other hosts)

- Run `bun run server.ts`
- The proxy listens on `http://localhost:PORT/<subdomain>/<path>`.

## Code Overview

- `server.ts`: Bun entry point.
- `src/proxyHandler.ts`: Shared proxy logic used by Bun server and Vercel Edge Function.
- `api/proxy/route.ts`: Vercel Edge Function handler.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for improvements or bug fixes.


