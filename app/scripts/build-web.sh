#!/usr/bin/env bash
# Exporte la PWA dans dist/ (build Vercel).
set -euo pipefail
cd "$(dirname "$0")/.."

# Expo lit aussi app/.env : la clé VAPID peut venir de l'environnement ou de ce fichier.
vapid="${EXPO_PUBLIC_VAPID_PUBLIC_KEY:-}"
if [ -z "$vapid" ] && [ -f .env ]; then
  vapid="$(grep -E '^[[:space:]]*(export[[:space:]]+)?EXPO_PUBLIC_VAPID_PUBLIC_KEY=' .env | tail -n1 | cut -d= -f2- | tr -d "\"' \r" || true)"
fi
if [ -z "$vapid" ]; then
  echo "Erreur : EXPO_PUBLIC_VAPID_PUBLIC_KEY est vide ou absente." >&2
  echo "Générez les clés avec « npx web-push generate-vapid-keys », puis définissez" >&2
  echo "EXPO_PUBLIC_VAPID_PUBLIC_KEY (clé publique) dans l'environnement ou dans app/.env." >&2
  exit 1
fi

EXPO_PUBLIC_API_URL=/api npx expo export -p web
