#!/usr/bin/env bash
set -uo pipefail

OUTPUT_DIR="${1:-.e2e}"

[ -d "$OUTPUT_DIR" ] || exit 0

find "$OUTPUT_DIR" -path "$OUTPUT_DIR/cache" -prune -o -type f -print0 \
  | xargs -0 perl -pi -e '
      BEGIN { @credentials = grep { length } map { $ENV{$_} // "" } qw(E2E_ADMIN_USER E2E_ADMIN_PASSWORD E2E_SAML_USERNAME E2E_SAML_PASSWORD E2E_CAS_USERNAME E2E_CAS_PASSWORD CLAUDE_CODE_OAUTH_TOKEN) }
      for my $credential (@credentials) { s/\Q$credential\E/***REDACTED***/g }
    ' 2>/dev/null || true
