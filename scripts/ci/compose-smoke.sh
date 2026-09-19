#!/usr/bin/env bash

set -Eeuo pipefail

AEROEYES_WEB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AEROEYES_CI_ENV="$(mktemp "${TMPDIR:-/tmp}/aeroeyes-ci.XXXXXX")"
AEROEYES_CI_PROJECT="aeroeyes-ci-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
AEROEYES_API_URL="http://localhost:18000"
AEROEYES_WEB_URL="http://localhost:18080"

cd "$AEROEYES_WEB_ROOT"

compose=(
  docker compose
  --project-name "$AEROEYES_CI_PROJECT"
  --env-file "$AEROEYES_CI_ENV"
)

cleanup() {
  status=$?
  if (( status != 0 )); then
    "${compose[@]}" logs --no-color || true
  fi
  "${compose[@]}" down --volumes --remove-orphans || true
  rm -f "$AEROEYES_CI_ENV"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cp compose.env.example "$AEROEYES_CI_ENV"

"${compose[@]}" config --quiet
"${compose[@]}" up --build --detach
"${compose[@]}" build core-demo

for attempt in {1..30}; do
  if curl --fail --silent --show-error "$AEROEYES_API_URL/health" >/dev/null; then
    break
  fi
  if (( attempt == 30 )); then
    echo "Monitoring API did not become healthy" >&2
    exit 1
  fi
  sleep 2
done

web_response="$(
  curl --fail --silent --show-error "$AEROEYES_WEB_URL/"
)"
grep -q 'id="root"' <<<"$web_response"

session_response="$(
  curl --fail --silent --show-error \
    --request POST \
    "$AEROEYES_API_URL/sessions"
)"
session_id="$(
  printf '%s' "$session_response" \
    | python3 -c 'import json, sys; print(json.load(sys.stdin)["session_id"])'
)"

core_output="$(
  "${compose[@]}" run --rm \
    --env "AEROEYES_MONITORING_SESSION_ID=$session_id" \
    core-demo
)"
printf '%s\n' "$core_output"
printf '%s' "$core_output" \
  | grep -Eq '"delivery"[[:space:]]*:[[:space:]]*"(CREATED|ALREADY_PROCESSED)"'

attention_response="$(
  curl --fail --silent --show-error \
    "$AEROEYES_API_URL/sessions/$session_id/attention-state"
)"
printf '%s' "$attention_response" | python3 -c '
import json
import sys

payload = json.load(sys.stdin)
latest_event = payload.get("latest_event")
assert payload["availability"] == "AVAILABLE", payload
assert latest_event is not None, payload
assert latest_event["session_id"] == payload["session_id"], payload
assert latest_event["state"] == "NORMAL", payload
assert latest_event["face_detected"] is True, payload
assert latest_event["eye_state"] == "OPEN", payload
print(json.dumps(payload, sort_keys=True))
'
