#!/bin/bash
# Hook SessionStart — prépare l'environnement des sessions Claude Code sur le web
# (y compris les routines automatiques) : installe les dépendances npm pour que
# le build, le lint (tsc), et les workflows d'audit puissent tourner tout de suite.
#
# Idempotent (sûr à relancer), non interactif, et limité aux sessions distantes
# (ne s'exécute pas sur ta machine locale).
set -euo pipefail

# N'agir que dans l'environnement distant (Claude Code on the web / routines).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Installe les dépendances si le dossier node_modules est absent ou incomplet.
# `npm install` profite du cache du conteneur et ne réinstalle rien d'inutile.
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  npm install --no-audit --no-fund
fi
