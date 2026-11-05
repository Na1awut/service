# Nexus API Gateway

A small API gateway and dashboard, created with Google AI Studio. It offers API key management and three sample services behind key authentication.

> This is a prototype. Keys are stored in memory, the management endpoints have no authentication, and the default key is public. Do not expose it to the internet as is. The figures and pricing on the landing page are placeholder content.

## Services

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/gateway/echo` | Returns the JSON payload you send |
| `GET` | `/gateway/random` | Returns a random UUID and number |
| `POST` | `/gateway/ai` | Generates text with Gemini from `{ "prompt": "..." }` |

Send the key in the `x-api-key` header or the `apiKey` query parameter.

Management endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | List services |
| `GET` | `/api/keys` | List API keys |
| `POST` | `/api/keys` | Create an API key |
| `DELETE` | `/api/keys/:key` | Revoke an API key |

## Getting started

Node.js is required.

```bash
npm install
cp .env.example .env.local
```

Set `GEMINI_API_KEY` in `.env.local`. Only `/gateway/ai` needs it.

Run the API and the web app in separate terminals:

```bash
npm run dev:server
npm run dev
```

Try it with the development key:

```bash
curl -H "x-api-key: dev-key-123" http://localhost:3000/gateway/random
```

## Production build

`npm run build` builds the web app and the server. `npm start` runs the compiled API server from `dist/server.js`, and the static web app in `dist/` must be hosted separately.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, Express and the Google Gen AI SDK.
