#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SESSION_DIR="db/slack-session"

# Load from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -E '^VPS_(USER|HOST|SSH_KEY|APP_DIR)=' "$PROJECT_DIR/.env" | xargs)
fi

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
VPS_APP_DIR="${VPS_APP_DIR:-/app}"

if [ -z "$VPS_HOST" ]; then
  echo "Error: VPS_HOST is not set in .env"
  exit 1
fi

if [ ! -d "$PROJECT_DIR/$SESSION_DIR" ]; then
  echo "Error: No Slack session found at $PROJECT_DIR/$SESSION_DIR"
  echo "Run /slack-setup on your local server first to log in."
  exit 1
fi

SSH_OPTS=""
if [ -n "$VPS_SSH_KEY" ]; then
  # Expand ~ to home directory
  EXPANDED_KEY="${VPS_SSH_KEY/#\~/$HOME}"
  SSH_OPTS="-e \"ssh -i $EXPANDED_KEY\""
fi

echo "Syncing Slack session to $VPS_USER@$VPS_HOST:$VPS_APP_DIR/$SESSION_DIR"
eval rsync -az --delete $SSH_OPTS "$PROJECT_DIR/$SESSION_DIR/" "$VPS_USER@$VPS_HOST:$VPS_APP_DIR/$SESSION_DIR/"

if [ $? -eq 0 ]; then
  echo "Slack session synced successfully."
else
  echo "Error: Failed to sync Slack session."
  exit 1
fi
