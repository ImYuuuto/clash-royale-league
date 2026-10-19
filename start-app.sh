#!/usr/bin/env bash

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Charger l'environnement Node/npm/pnpm
export PATH="$HOME/.local/share/vite-plus/bin:$PATH"

# Nettoyage préventif au cas où une ancienne session traîne
fuser -k 5173/tcp 4000/tcp 2>/dev/null || true

# Lancer l'application
npm run dev

# Nettoyage complet à la fermeture de l'application
fuser -k 5173/tcp 4000/tcp 2>/dev/null || true
pkill -9 -f "clash-royale-league/frontend" 2>/dev/null || true
pkill -9 -f "clash-royale-league/backend" 2>/dev/null || true
