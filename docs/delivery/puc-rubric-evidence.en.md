# PUC-Rio MVP delivery evidence

[Português](puc-rubric-evidence.md) | **English**

This document maps the mandatory Sprint 3 requirements to the AeroEyes delivery. The evaluated architecture follows **Scenario 1.1**:

```text
AeroEyes Web → Monitoring API → AviationWeather Data API
                            ↘ PostgreSQL
```

The Attention Core is an additional AeroEyes ecosystem capability. It is documented separately and is not required to establish the three-module Scenario 1.1 boundary.

## Evidence matrix

| PUC-Rio requirement | AeroEyes implementation | Repository evidence | Demonstration evidence |
| --- | --- | --- | --- |
| User interface in HTML, CSS and JavaScript | React, TypeScript and Vite EFB monitoring console | `src/pages/MonitoringConsole`, `src/styles`, and production `Dockerfile` | Open the containerized Web and interact with a monitoring session |
| Interface calls GET, POST, PUT and DELETE | Web client calls Monitoring API session and context resources | `src/api/monitoringApi.ts` | `POST /sessions`, `GET /sessions/{id}`, `PUT /sessions/{id}/context`, and `DELETE /sessions/{id}/context` |
| Secondary API with at least four routes | FastAPI exposes health, sessions, context, weather, events and attention read models | Monitoring API `src/aeroeyes_monitoring_api/api` and `/docs` | Use Swagger/OpenAPI and the Web workflow |
| Persistent data store | PostgreSQL persists sessions, session context and attention events | SQLAlchemy repositories and Alembic migrations | Restart the API against the same database and retrieve the session |
| Public external API | Monitoring API consumes AviationWeather METAR server-side | `aviation_weather_client.py` and `session_weather_service.py` | Configure departure/destination ICAO codes and refresh METAR in the Web |
| External data is consumed inside the application | Provider data is validated and normalized before the Web receives it | `GET /sessions/{id}/weather` | Weather panel displays normalized observations and raw METAR; no redirect occurs |
| Dockerfile for each developed delivery component | Web and Monitoring API each provide a root Dockerfile | `aeroeyes-web/Dockerfile`, `aeroeyes-monitoring-api/Dockerfile` | Build through Docker Compose |
| Docker Compose at the principal component root | Web repository owns the composition | `compose.yaml`, `compose.env.example` | Start Web, API, migration job and PostgreSQL together |
| Architecture image | Canonical SVG and PNG describe required and optional boundaries | `docs/architecture/aeroeyes-mvp-architecture.*` | Present the diagram before the live demonstration |
| Separate public repositories | Web and Monitoring API are the two developed Scenario 1.1 components | GitHub repository links in the main README | Open both repositories during delivery |

## Required HTTP interactions

| Method | Route | UI action |
| --- | --- | --- |
| `GET` | `/health` | Display API availability |
| `POST` | `/sessions` | Start monitoring |
| `GET` | `/sessions/{session_id}` | Restore the canonical session |
| `POST` | `/sessions/{session_id}/complete` | Complete monitoring |
| `GET` | `/sessions/{session_id}/context` | Load flight context |
| `PUT` | `/sessions/{session_id}/context` | Save or replace flight context |
| `DELETE` | `/sessions/{session_id}/context` | Clear flight context |
| `GET` | `/sessions/{session_id}/weather` | Load normalized METAR observations |
| `GET` | `/sessions/{session_id}/attention-state` | Load the latest optional attention state |
| `GET` | `/sessions/{session_id}/events?limit=10` | Load recent optional attention events |

## External API declaration

- Provider: AviationWeather.gov Data API.
- Product: METAR aerodrome weather observations.
- Request used by the backend: `GET https://aviationweather.gov/api/data/metar` with documented query parameters for ICAO station identifiers and JSON format.
- Authentication: no account or API key is required for public weather data.
- Consumption boundary: only the Monitoring API calls the provider; the browser never calls it directly.
- Operational restriction: requests are intentionally scoped and user-triggered. The provider documents usage limits and asks consumers to avoid excessive request frequency.
- Official documentation: <https://aviationweather.gov/data/api/>

## Additional AeroEyes capability

The private Attention Core repository contains the native camera and calibration runtime and a deterministic `core-demo` container. Both can publish attention events to an existing `MonitoringSession`. This extension strengthens the project demonstration but remains outside the minimum Scenario 1.1 repository set.

The native and container paths are deliberately distinct:

- native Core: physical webcam, calibration UI, optional presentation audio and live attention analysis;
- `core-demo`: hardware-free deterministic observations for Docker and CI integration evidence.

## Final evidence still required

- Record the successful CI run URLs used in the delivery.
- Execute the #09B clean-room procedure from fresh clones.
- Record the final video URL after export.
