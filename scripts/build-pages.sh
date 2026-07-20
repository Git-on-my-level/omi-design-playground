#!/usr/bin/env bash
# Build the four demos + index into dist/ for GitHub Pages.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
vite_bin="${repo_root}/reference/hackathon-pack/node_modules/.bin/vite"
vite_config="${repo_root}/scripts/vite.prototype.config.mjs"
out_root="${repo_root}/dist"
# Project Pages URL: https://<user>.github.io/<repo>/
base_root="${PAGES_BASE:-/omi-design-playground}"
demos=(threshold ledger continuity recall)

if [[ ! -x "${vite_bin}" ]]; then
  echo "Run: cd reference/hackathon-pack && npm install" >&2
  exit 1
fi

rm -rf "${out_root}"
mkdir -p "${out_root}"

for name in "${demos[@]}"; do
  echo "Building ${name}…"
  OMI_PROTOTYPE_DIR="${repo_root}/prototypes/${name}" \
    "${vite_bin}" build \
      --config "${vite_config}" \
      --base "${base_root}/${name}/" \
      --outDir "${out_root}/${name}" \
      --emptyOutDir
  # Thumbnails for the index (same screenshot each prototype already keeps).
  if [[ -f "${repo_root}/prototypes/${name}/screenshot.png" ]]; then
    cp "${repo_root}/prototypes/${name}/screenshot.png" "${out_root}/${name}/screenshot.png"
  fi
done

# Relative links on the index work under the project Pages base path.
cp "${repo_root}/pages/index.html" "${out_root}/index.html"
cp "${repo_root}/pages/style.css" "${out_root}/style.css"

echo "Built → ${out_root}/"
