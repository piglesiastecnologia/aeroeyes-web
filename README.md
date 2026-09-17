# AeroEyes Web

EFB-inspired Monitoring Console built with React, TypeScript, and Vite.

## Local development

Copy `.env.example` to `.env.local` and configure the Monitoring API base URL:

```dotenv
VITE_MONITORING_API_URL=http://127.0.0.1:8000
```

Then start the frontend:

```sh
npm run dev
```

The console requests `GET /health` once when it mounts. A valid AeroEyes Monitoring API response displays `API ONLINE`; missing configuration, connectivity errors, non-success responses, or an unexpected payload display `API OFFLINE`.

When the API is online, **Start monitoring** creates a real MonitoringSession through `POST /sessions`. The session ID is retained in `sessionStorage` for the current browser tab, and a reload restores the canonical session with `GET /sessions/{session_id}`. An active session is completed through `POST /sessions/{session_id}/complete`.

The Attention Status panel reads `GET /sessions/{session_id}/attention-state`. Active sessions poll sequentially once per second, with no overlapping requests; completed sessions are read once. Because attention events are transition-based, the event timestamp is presented as the **last state change**, not as proof that the local Core is currently live. Failed refreshes retain the last valid event as **last known** while marking current telemetry unavailable.

Flight Context belongs to the current MonitoringSession and is always loaded from the Monitoring API with `GET /sessions/{session_id}/context`; context data is not persisted in browser storage. Saving sends all fields through `PUT`, which completely replaces the context resource, while **Clear context** removes it through `DELETE`.

The Weather panel retrieves current METAR data only through the Monitoring API's `GET /sessions/{session_id}/weather` route. The browser never calls AviationWeather.gov directly, does not poll, and does not persist weather locally; updates occur when the canonical route changes or when the user explicitly selects **Refresh METAR**.

## Docker demonstration

The Docker composition is the reproducible integration path for the MVP. It
starts PostgreSQL, applies API migrations as a one-shot job, starts the
Monitoring API, and serves the production Web build at
`http://localhost:18080`.

The Core demonstration is deliberately a separate, one-shot container. It
does not access a webcam or create a browser window. Instead, it executes the
existing explicit calibration and monitoring pipeline with deterministic EAR
observations and monotonic timestamps. At the delivery boundary, it uses the
UTC time when the job starts so the event belongs to the real MonitoringSession.
The native Core remains the separate demonstration path for physical camera
acquisition.

From this repository, with the sibling repositories `aeroeyes-monitoring-api`
and `aeroeyes-poc` present in the same `Apps` directory:

```sh
cp compose.env.example compose.env.aeroeyes
docker compose --env-file compose.env.aeroeyes up --build -d
```

Wait until `docker compose --env-file compose.env.aeroeyes ps` reports the API as healthy. Open the Web at
`http://localhost:18080`, select **Start monitoring**, and copy the created
session ID. Then run the deterministic Core delivery:

```sh
docker compose --env-file compose.env.aeroeyes run --rm \
  -e AEROEYES_MONITORING_SESSION_ID=<session-id> \
  core-demo
```

The command emits JSON confirming that it entered `MONITORING` and that the
Monitoring API accepted the event. Refreshing the Web shows the resulting
attention state. To stop the environment while retaining local database data:

```sh
docker compose --env-file compose.env.aeroeyes down
```

Use `docker compose --env-file compose.env.aeroeyes down -v` only when intentionally discarding the local
PostgreSQL volume.

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
