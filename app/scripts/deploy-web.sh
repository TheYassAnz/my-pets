#!/usr/bin/env bash
# Exporte la PWA et remplace ../api/client/ par le build (servi par l'API).
set -euo pipefail
cd "$(dirname "$0")/.."

EXPO_PUBLIC_API_URL=/api npx expo export -p web

# L'export a réussi : seulement maintenant on vide la destination.
find ../api/client -mindepth 1 ! -name .gitkeep -delete
cp -R dist/. ../api/client/
