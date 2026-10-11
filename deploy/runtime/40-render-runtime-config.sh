#!/bin/sh
# Renders the per-environment files from the container environment, so the same
# image is promoted from one environment to the next.
set -eu

TEMPLATES=/opt/csp-runtime
HTML=/usr/share/nginx/html
REQUIRED="GATEWAY_URL AUTH_REMOTE_URL CATALOG_REMOTE_URL BOOKING_REMOTE_URL CONCESSIONS_REMOTE_URL TICKETING_REMOTE_URL CORS_ALLOWED_ORIGIN_REGEX"

missing=""
for name in $REQUIRED; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    missing="$missing $name"
  fi
done
if [ -n "$missing" ]; then
  echo "csp-front: missing required environment variables:$missing" >&2
  exit 1
fi

variables=""
for name in $REQUIRED; do
  variables="$variables \${$name}"
done

envsubst "$variables" < "$TEMPLATES/config.json.template" > "$HTML/config.json"
envsubst "$variables" < "$TEMPLATES/federation.manifest.json.template" > "$HTML/federation.manifest.json"
envsubst "$variables" < "$TEMPLATES/cors-origin.conf.template" > /etc/nginx/conf.d/cors-origin.conf
echo "csp-front: runtime configuration rendered"
