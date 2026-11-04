#!/usr/bin/env bash
# Usage: hash-dir.sh <dir>
set -euo pipefail

cd "$1"
find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d ' ' -f 1
