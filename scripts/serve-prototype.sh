#!/usr/bin/env bash
set -euo pipefail

prototype="${1:-hello-world}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
prototype_dir="${repo_root}/prototypes/${prototype}"
vite_bin="${repo_root}/reference/hackathon-pack/node_modules/.bin/vite"

if [[ ! -d "${prototype_dir}" ]]; then
  echo "Unknown prototype: ${prototype}" >&2
  echo "Available prototypes:" >&2
  find "${repo_root}/prototypes" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; >&2
  exit 1
fi

if [[ ! -x "${vite_bin}" ]]; then
  echo "Hackathon pack dependencies are not installed." >&2
  echo "Run: cd reference/hackathon-pack && npm install" >&2
  exit 1
fi

exec "${vite_bin}" "${prototype_dir}" --host 127.0.0.1
