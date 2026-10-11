#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-.e2e}"

[ -d "$OUTPUT_DIR" ] || exit 0

COMPRESSED_FILES="$(find "$OUTPUT_DIR" -path "$OUTPUT_DIR/cache" -prune -o -type f -name '*.gz' -print)"
if [ -n "$COMPRESSED_FILES" ]; then
  echo "::error title=Unredactable E2E output::Compressed files cannot be redacted, so nothing is uploaded: ${COMPRESSED_FILES//$'\n'/, }"
  exit 1
fi

find "$OUTPUT_DIR" -path "$OUTPUT_DIR/cache" -prune -o -type f -exec perl -pi -e '
      BEGIN { @credentials = grep { length } map { $ENV{$_} // "" } qw(E2E_ADMIN_USER E2E_ADMIN_PASSWORD E2E_SAML_USERNAME E2E_SAML_PASSWORD E2E_CAS_USERNAME E2E_CAS_PASSWORD CLAUDE_CODE_OAUTH_TOKEN) }
      for my $credential (@credentials) { s/\Q$credential\E/***REDACTED***/g }
      s/([?&]token=)[^&\s"<>\\]+/$1***REDACTED***/g;
    ' {} +
