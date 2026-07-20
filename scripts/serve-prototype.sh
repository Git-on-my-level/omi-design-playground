#!/usr/bin/env bash
set -euo pipefail

prototype="${1:-hello-world}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
prototype_dir="${repo_root}/prototypes/${prototype}"
vite_bin="${repo_root}/reference/hackathon-pack/node_modules/.bin/vite"
vite_config="${repo_root}/scripts/vite.prototype.config.mjs"

if [[ ! -d "${prototype_dir}" || "${prototype}" == _* ]]; then
  if [[ "${prototype}" == _* ]]; then
    echo "'${prototype}' is a scaffold, not a prototype. Copy it: ./scripts/new-prototype.sh <name>" >&2
  else
    echo "Unknown prototype: ${prototype}" >&2
  fi
  echo "Available prototypes:" >&2
  find "${repo_root}/prototypes" -mindepth 1 -maxdepth 1 -type d -not -name '_*' -exec basename {} \; >&2
  exit 1
fi

if [[ ! -x "${vite_bin}" ]]; then
  echo "Hackathon pack dependencies are not installed." >&2
  echo "Run: cd reference/hackathon-pack && npm install" >&2
  exit 1
fi

# Vite never typechecks. Do it here so a broken prototype fails at the terminal
# rather than silently in the browser. OMI_SKIP_TYPECHECK=1 to bypass.
tsc_bin="${repo_root}/reference/hackathon-pack/node_modules/.bin/tsc"
if [[ -z "${OMI_SKIP_TYPECHECK:-}" && -x "${tsc_bin}" ]]; then
  if ! "${tsc_bin}" -p "${repo_root}/prototypes"; then
    echo "" >&2
    echo "Typecheck failed. Fix the above, or set OMI_SKIP_TYPECHECK=1 to serve anyway." >&2
    exit 1
  fi
fi

export OMI_PROTOTYPE_DIR="${prototype_dir}"
cd "${repo_root}/reference/hackathon-pack"
exec "${vite_bin}" --config "${vite_config}" --host 127.0.0.1
