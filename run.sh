#!/usr/bin/env bash
# Runs the backend (Express) and frontend (Vite) dev servers together.
cd "$(dirname "$0")"

trap 'kill 0' SIGINT SIGTERM EXIT

npm run dev:backend &
npm run dev:frontend &

wait
