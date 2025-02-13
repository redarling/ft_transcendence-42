#!/bin/bash

ENV_FILE="./docker/.env"

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
  "WEBSOCKET_API_TOKEN"
  "TWOFA_EMAIL"
  "TWOFA_EMAIL_PASSWORD"
  "TWOFA_SERVER"
  "TWOFA_SERVER_PORT"
  "TWOFA_BOT"
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

OS=$(uname)

add_to_hosts() {
  local hostname=$1
  local hosts_file="/etc/hosts"

  if ! grep -q "$hostname" "$hosts_file"; then
    if [[ "$OS" == "Linux" ]]; then
      echo "127.0.0.1 $hostname" | sudo tee -a "$hosts_file" > /dev/null
      echo "Added $hostname to /etc/hosts"

    elif [[ "$OS" == "Darwin" ]]; then
      echo "127.0.0.1 $hostname" | sudo tee -a "$hosts_file" > /dev/null
      echo "Added $hostname to /etc/hosts"
    else
      echo "Unsupported OS for adding to /etc/hosts"
    fi
  else
    echo "$hostname already exists in /etc/hosts"
  fi
}

add_to_hosts "transcendence-pong"

echo "All required environment variables are present in $ENV_FILE."
exit 0
