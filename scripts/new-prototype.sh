#!/usr/bin/env bash
set -euo pipefail

name="${1:-}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
template_dir="${repo_root}/prototypes/_template"
target_dir="${repo_root}/prototypes/${name}"

if [[ -z "${name}" ]]; then
  echo "Usage: ./scripts/new-prototype.sh <kebab-name>" >&2
  exit 1
fi

if [[ ! "${name}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Prototype names are kebab-case: ${name}" >&2
  exit 1
fi

if [[ -e "${target_dir}" ]]; then
  echo "Already exists: prototypes/${name}" >&2
  exit 1
fi

cp -R "${template_dir}" "${target_dir}"
rm -f "${target_dir}/README.md"

echo "Created prototypes/${name}"
echo "Serve it:  ./scripts/serve-prototype.sh ${name}"
