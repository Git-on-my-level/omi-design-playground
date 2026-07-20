#!/usr/bin/env bash
# Screenshot a prototype. Boots vite on an ephemeral port, shoots it headless,
# tears everything down. No dependencies beyond a local Chrome.
#
#   ./scripts/screenshot-prototype.sh threshold
#   ./scripts/screenshot-prototype.sh threshold --wait 1400 --size 1512x982
#   ./scripts/screenshot-prototype.sh threshold --scenario first-run -o /tmp/x.png
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

prototype="${1:-}"
shift || true

out=""
size="1512x982"
wait_ms="1200"
scenario=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--out)      out="$2"; shift 2 ;;
    --size)        size="$2"; shift 2 ;;
    --wait)        wait_ms="$2"; shift 2 ;;
    --scenario)    scenario="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${prototype}" ]]; then
  echo "Usage: ./scripts/screenshot-prototype.sh <prototype> [--wait ms] [--size WxH] [--scenario name] [-o path]" >&2
  exit 1
fi

if [[ ! -d "${repo_root}/prototypes/${prototype}" || "${prototype}" == _* ]]; then
  echo "Unknown prototype: ${prototype}" >&2
  find "${repo_root}/prototypes" -mindepth 1 -maxdepth 1 -type d -not -name '_*' -exec basename {} \; >&2
  exit 1
fi

if [[ ! -x "${chrome}" ]]; then
  echo "Google Chrome not found at: ${chrome}" >&2
  echo "Install Chrome, or screenshot manually from ./scripts/serve-prototype.sh ${prototype}" >&2
  exit 1
fi

out="${out:-${repo_root}/prototypes/${prototype}/screenshot.png}"
mkdir -p "$(dirname "${out}")"

log="$(mktemp)"
profile="$(mktemp -d)"
cleanup() {
  [[ -n "${vite_pid:-}" ]] && kill "${vite_pid}" 2>/dev/null || true
  rm -rf "${profile}" "${log}"
}
trap cleanup EXIT

# Boot vite on a port it picks itself, so concurrent runs never collide.
OMI_PROTOTYPE_DIR="${repo_root}/prototypes/${prototype}" \
  "${repo_root}/reference/hackathon-pack/node_modules/.bin/vite" \
  --config "${repo_root}/scripts/vite.prototype.config.mjs" \
  --host 127.0.0.1 --port 0 --strictPort false >"${log}" 2>&1 &
vite_pid=$!

url=""
for _ in $(seq 1 60); do
  url="$(grep -o 'http://127.0.0.1:[0-9]*' "${log}" | head -1 || true)"
  [[ -n "${url}" ]] && break
  sleep 0.25
done

if [[ -z "${url}" ]]; then
  echo "vite failed to start:" >&2
  cat "${log}" >&2
  exit 1
fi

[[ -n "${scenario}" ]] && url="${url}/?scenario=${scenario}"

# --virtual-time-budget lets animations and timers advance before the shot, so
# the result is deterministic rather than a race against real time.
#
# Chrome will not exit on its own here: a prototype with a running setInterval
# never drains the virtual clock. Shoot in the background, wait for the file,
# then kill it.
rm -f "${out}"
"${chrome}" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=2 \
  --user-data-dir="${profile}" \
  --window-size="${size/x/,}" \
  --virtual-time-budget="${wait_ms}" \
  --screenshot="${out}" \
  "${url}" >/dev/null 2>&1 &
chrome_pid=$!

for _ in $(seq 1 120); do
  # Non-empty and stable across two polls means the write finished.
  if [[ -s "${out}" ]]; then
    size_a=$(wc -c <"${out}")
    sleep 0.25
    size_b=$(wc -c <"${out}")
    [[ "${size_a}" == "${size_b}" ]] && break
  fi
  sleep 0.25
done

kill "${chrome_pid}" 2>/dev/null || true
wait "${chrome_pid}" 2>/dev/null || true

if [[ ! -s "${out}" ]]; then
  echo "Chrome produced no image for ${url}" >&2
  exit 1
fi

echo "${out}"
