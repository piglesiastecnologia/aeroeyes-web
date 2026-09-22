# AeroEyes Web

[Português](README.md) · [English](README.en.md)

Web interface for the **AeroEyes Monitoring System**, built with React,
TypeScript, and Vite. This repository is the MVP delivery entry point and owns
the system's reproducible Docker Compose configuration.

## PUC-Rio delivery scope

The MVP follows **Sprint 3 scenario 1.1**:

```text
AeroEyes Web → Monitoring API → AviationWeather Data API
                            ↘ PostgreSQL
```

- **Developed frontend:** AeroEyes Web.
- **Developed backend:** AeroEyes Monitoring API.
- **Public external API:** AviationWeather.gov Data API, consumed by the backend.
- **Persistence:** PostgreSQL.
- **Optional extension:** native Attention Core and deterministic `core-demo`.

The Attention Core adds camera acquisition, calibration, and attention
classification, but it is not required to establish the minimum scenario 1.1
boundary.

[![Canonical AeroEyes MVP architecture — PUC-Rio scenario 1.1](docs/architecture/aeroeyes-mvp-architecture.png)](docs/architecture/aeroeyes-mvp-architecture.svg)

_Canonical MVP architecture: the required scenario 1.1 delivery and the
Attention Core explicitly separated as an optional extension. Click the image
to open the vector version._

See the [rubric evidence matrix](docs/delivery/puc-rubric-evidence.md), the
[editable SVG](docs/architecture/aeroeyes-mvp-architecture.svg), and the
[Mermaid source](docs/architecture/aeroeyes-mvp-architecture.mmd).

## Delivery repositories

| Component | Responsibility | Repository |
| --- | --- | --- |
| AeroEyes Web | HTML/CSS/JavaScript interface and Docker composition | [piglesiastecnologia/aeroeyes-web](https://github.com/piglesiastecnologia/aeroeyes-web) |
| Monitoring API | REST API, external integration, and persistence | [piglesiastecnologia/aeroeyes-monitoring-api](https://github.com/piglesiastecnologia/aeroeyes-monitoring-api) |
| Attention Core | Private optional extension for local capture and analysis | Documented separately; outside the minimum scenario 1.1 scope |

## Demonstrated capabilities

- create, restore, and complete a monitoring session;
- create, replace, and clear flight context;
- retrieve departure and destination METAR through the Monitoring API;
- read the latest attention state and recent events when produced by the Core;
- show truthful unavailable, missing-context, and no-telemetry states.

The browser uses `GET`, `POST`, `PUT`, and `DELETE`. It never calls
AviationWeather.gov directly: the Monitoring API validates and normalizes the
provider response.

## Local frontend

Requirements:

- Node.js 22.15 or compatible;
- a running Monitoring API.

Copy `.env.example` to `.env.local`:

```dotenv
VITE_MONITORING_API_URL=http://127.0.0.1:8000
```

Then install and start:

```sh
npm ci
npm run dev
```

The application is available at `http://localhost:5173`.

## Reproducible Docker Compose execution

The required MVP path starts PostgreSQL, applies API migrations, starts the
Monitoring API, and serves the production Web build at
`http://localhost:18080`.

Keep `aeroeyes-web` and `aeroeyes-monitoring-api` as sibling directories. From
this repository:

```sh
cp compose.env.example compose.env.aeroeyes
docker compose --env-file compose.env.aeroeyes up --build -d
docker compose --env-file compose.env.aeroeyes ps
```

Stop the environment while preserving local data with:

```sh
docker compose --env-file compose.env.aeroeyes down
```

Use `down -v` only when you intentionally want to remove the database volume.

### Optional Attention Core demonstration

When the private `aeroeyes-poc` repository is also present as a sibling, the
optional `core-demo` profile can publish deterministic events to an existing
session without camera, GUI, or audio hardware:

```sh
docker compose --env-file compose.env.aeroeyes run --rm \
  -e AEROEYES_MONITORING_SESSION_ID=<session-id> \
  core-demo
```

The native webcam Core is a separate local demonstration. The browser does not
control the camera, and the required delivery path does not depend on it.

## HTTP contracts exercised by the UI

| Method | Route | Action |
| --- | --- | --- |
| `GET` | `/health` | Read API availability |
| `POST` | `/sessions` | Start monitoring |
| `GET` | `/sessions/{session_id}` | Restore the canonical session |
| `POST` | `/sessions/{session_id}/complete` | Complete the session |
| `GET` | `/sessions/{session_id}/context` | Load flight context |
| `PUT` | `/sessions/{session_id}/context` | Replace flight context |
| `DELETE` | `/sessions/{session_id}/context` | Clear flight context |
| `GET` | `/sessions/{session_id}/weather` | Load normalized METAR |
| `GET` | `/sessions/{session_id}/attention-state` | Load latest attention state |
| `GET` | `/sessions/{session_id}/events?limit=10` | Load recent events |

## Validation

```sh
npm run lint
npm run build
```

CI defines frontend, image, and deterministic composition-smoke validation.
The final #09B clean-room run records successful execution links. Because the
Core is private, an integration job can include `core-demo` only when it has
explicit repository access; this does not change the required Web/API/DB path.

## Declared limits

- This is an academic experimental MVP, not certified aviation or medical software.
- METAR is current operational context, not an attention-classification input.
- The weather route does not retain history or cache data in this MVP.
- Attention events represent semantic transitions, not continuous biometric telemetry.
