#!/bin/bash

ENV_FILE="./srcs/.env"

REQUIRED_VARS=(
  "POSTGRES_DB"
  "POSTGRES_USER"
  "POSTGRES_PASSWORD"
  "POSTGRES_HOST"
  "POSTGRES_PORT"
  "DJANGO_SECRET_KEY"
  "DJANGO_DEBUG"
  "DJANGO_ALLOWED_HOSTS"
  "DJANGO_SECURE_SSL_REDIRECT"
  "DJANGO_SECURE_BROWSER_XSS_FILTER"
)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^${var}=" "$ENV_FILE"; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "Error: The following required environment variables are missing from $ENV_FILE:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  exit 1
fi

echo "All required environment variables are present in $ENV_FILE."
exit 0
