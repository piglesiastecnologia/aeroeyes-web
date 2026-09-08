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

Flight Context belongs to the current MonitoringSession and is always loaded from the Monitoring API with `GET /sessions/{session_id}/context`; context data is not persisted in browser storage. Saving sends all fields through `PUT`, which completely replaces the context resource, while **Clear context** removes it through `DELETE`.

The Weather panel retrieves current METAR data only through the Monitoring API's `GET /sessions/{session_id}/weather` route. The browser never calls AviationWeather.gov directly, does not poll, and does not persist weather locally; updates occur when the canonical route changes or when the user explicitly selects **Refresh METAR**.

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
