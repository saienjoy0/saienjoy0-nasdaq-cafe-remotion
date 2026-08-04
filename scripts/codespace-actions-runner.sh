#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${GITHUB_REPOSITORY:-saienjoy0/saienjoy0-nasdaq-cafe-remotion}"
REPOSITORY_URL="https://github.com/${REPOSITORY}"
RUNNER_DIR="${HOME}/.local/share/nasdaq-cafe-actions-runner"
RUNNER_NAME="${CODESPACE_NAME:-codespace}-nasdaq-cafe"
RUNNER_LABELS="nasdaq-cafe-codespace"
PID_FILE="${RUNNER_DIR}/runner.pid"
LOG_FILE="${RUNNER_DIR}/runner.log"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/codespace-actions-runner.sh register
  bash scripts/codespace-actions-runner.sh ensure
  bash scripts/codespace-actions-runner.sh start
  bash scripts/codespace-actions-runner.sh status
  bash scripts/codespace-actions-runner.sh stop
  bash scripts/codespace-actions-runner.sh remove

register:
  Downloads the official GitHub Actions runner, verifies its release digest when
  available, and registers this Codespace with the custom label
  nasdaq-cafe-codespace.

  Codespaces' injected GITHUB_TOKEN may not have repository Administration
  permission. In that case, obtain the one-hour token from repository
  Settings -> Actions -> Runners -> New self-hosted runner and run:

    read -rsp "Runner token: " RUNNER_TOKEN; echo
    RUNNER_TOKEN="$RUNNER_TOKEN" bash scripts/codespace-actions-runner.sh register
    unset RUNNER_TOKEN

ensure:
  Performs the one-time registration when possible and starts the runner. After
  a runner has been registered once, Codespaces calls this command automatically
  whenever the Codespace starts or resumes.

start:
  Starts the registered runner in the background for this Codespace session.
EOF
}

require_codespace() {
  if [[ -z "${CODESPACE_NAME:-}" ]]; then
    echo "This helper must be run inside the intended GitHub Codespace." >&2
    exit 1
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "Do not register the Actions runner as root." >&2
    exit 1
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

registration_token() {
  if [[ -n "${RUNNER_TOKEN:-}" ]]; then
    printf '%s\n' "$RUNNER_TOKEN"
    return 0
  fi

  local token
  if ! token="$(
    gh api \
      --method POST \
      -H "Accept: application/vnd.github+json" \
      "repos/${REPOSITORY}/actions/runners/registration-token" \
      --jq .token
  )"; then
    echo "Could not obtain a runner registration token with the current gh credential." >&2
    echo "Codespaces' injected GITHUB_TOKEN commonly lacks repository Administration write permission." >&2
    return 1
  fi
  printf '%s\n' "$token"
}

download_runner() {
  mkdir -p "$RUNNER_DIR"
  if [[ -x "${RUNNER_DIR}/config.sh" && -x "${RUNNER_DIR}/run.sh" ]]; then
    return
  fi

  local release_json version asset_name asset_url asset_digest archive
  release_json="$(gh api repos/actions/runner/releases/latest)"
  version="$(jq -r '.tag_name | sub("^v"; "")' <<<"$release_json")"
  asset_name="actions-runner-linux-x64-${version}.tar.gz"
  asset_url="$(
    jq -r --arg name "$asset_name" \
      '.assets[] | select(.name == $name) | .browser_download_url' \
      <<<"$release_json"
  )"
  asset_digest="$(
    jq -r --arg name "$asset_name" \
      '.assets[] | select(.name == $name) | (.digest // "")' \
      <<<"$release_json"
  )"
  if [[ -z "$asset_url" || "$asset_url" == "null" ]]; then
    echo "Could not find official runner asset: $asset_name" >&2
    exit 1
  fi

  archive="${RUNNER_DIR}/${asset_name}"
  curl --fail --location --retry 3 --output "$archive" "$asset_url"
  if [[ "$asset_digest" == sha256:* ]]; then
    printf '%s  %s\n' "${asset_digest#sha256:}" "$archive" | sha256sum --check -
  else
    echo "Warning: GitHub release metadata did not include a SHA-256 digest." >&2
  fi
  tar --extract --gzip --file "$archive" --directory "$RUNNER_DIR"
  rm -f "$archive"
}

register_runner() {
  require_codespace
  require_command gh
  require_command jq
  require_command curl
  require_command sha256sum
  gh auth status >/dev/null
  download_runner

  if [[ -f "${RUNNER_DIR}/.runner" ]]; then
    echo "Runner is already registered at ${RUNNER_DIR}."
    return 0
  fi

  local token
  if ! token="$(registration_token)"; then
    cat >&2 <<'EOF'

Open this repository in GitHub, then go to:
  Settings -> Actions -> Runners -> New self-hosted runner -> Linux -> x64

Copy only the short-lived token shown in the ./config.sh command, then run:
  read -rsp "Runner token: " RUNNER_TOKEN; echo
  RUNNER_TOKEN="$RUNNER_TOKEN" bash scripts/codespace-actions-runner.sh register
  unset RUNNER_TOKEN
EOF
    return 1
  fi
  if [[ -z "$token" || "$token" == "null" ]]; then
    echo "The runner registration token was empty." >&2
    return 1
  fi

  (
    cd "$RUNNER_DIR"
    ./config.sh \
      --unattended \
      --url "$REPOSITORY_URL" \
      --token "$token" \
      --name "$RUNNER_NAME" \
      --labels "$RUNNER_LABELS" \
      --work _work \
      --replace
  )
  echo "Registered runner: ${RUNNER_NAME}"
  echo "Custom label: ${RUNNER_LABELS}"
}

start_runner() {
  require_codespace
  if [[ ! -f "${RUNNER_DIR}/.runner" ]]; then
    echo "Runner is not registered. Run the register command first." >&2
    return 1
  fi
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Runner is already running with PID $(cat "$PID_FILE")."
    return 0
  fi

  rm -f "$PID_FILE"
  (
    cd "$RUNNER_DIR"
    nohup ./run.sh >"$LOG_FILE" 2>&1 &
    echo "$!" >"$PID_FILE"
  )
  sleep 3
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Runner failed to start. Recent log:" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    return 1
  fi
  echo "Runner started with PID $(cat "$PID_FILE")."
  tail -n 12 "$LOG_FILE" || true
}

ensure_runner() {
  require_codespace
  if [[ ! -f "${RUNNER_DIR}/.runner" ]]; then
    echo "Runner is not registered yet; attempting one-time registration."
    register_runner
  fi
  start_runner
}

status_runner() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "running pid=$(cat "$PID_FILE")"
    tail -n 20 "$LOG_FILE" || true
  else
    echo "stopped"
    [[ -f "$LOG_FILE" ]] && tail -n 20 "$LOG_FILE" || true
  fi
}

stop_runner() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Runner is not running."
    return 0
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    for _ in {1..10}; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 1
    done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" || true
  fi
  rm -f "$PID_FILE"
  echo "Runner stopped."
}

remove_runner() {
  require_codespace
  stop_runner
  if [[ ! -f "${RUNNER_DIR}/.runner" ]]; then
    echo "Runner is not registered."
    return 0
  fi
  local token
  if ! token="$(registration_token)"; then
    echo "A repository runner removal token is required." >&2
    return 1
  fi
  (
    cd "$RUNNER_DIR"
    ./config.sh remove --unattended --token "$token"
  )
  echo "Runner registration removed."
}

case "${1:-}" in
  register) register_runner ;;
  ensure) ensure_runner ;;
  start) start_runner ;;
  status) status_runner ;;
  stop) stop_runner ;;
  remove) remove_runner ;;
  *) usage; exit 1 ;;
esac
