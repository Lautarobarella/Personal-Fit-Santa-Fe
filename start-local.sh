#!/usr/bin/env bash
set -euo pipefail

NO_BUILD=false
FOLLOW_LOGS=false

for arg in "$@"; do
  case "$arg" in
    --no-build)
      NO_BUILD=true
      ;;
    --logs)
      FOLLOW_LOGS=true
      ;;
    *)
      echo "ERROR: opcion desconocida: $arg"
      echo "Uso: ./start-local.sh [--no-build] [--logs]"
      exit 1
      ;;
  esac
done

step() {
  echo "==> $1"
}

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

step "Iniciando entorno local de Personal Fit"

[[ -f ".env" ]] || fail "No existe .env en $SCRIPT_DIR"

command -v docker >/dev/null 2>&1 || fail "Docker no esta instalado o no esta en PATH"
docker info >/dev/null 2>&1 || fail "Docker daemon no responde. Inicia Docker Desktop"
docker compose version >/dev/null 2>&1 || fail "docker compose no esta disponible"

step "Preparando directorios locales"
mkdir -p local-data/firebase

step "Levantando servicios con docker compose"
if [[ "$NO_BUILD" == "true" ]]; then
  docker compose --env-file .env up -d
else
  docker compose --env-file .env up -d --build
fi

echo
echo "Servicios levantados correctamente."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080/api/health"
echo "PgAdmin:  http://localhost:5050"
echo
echo "Para apagar todo:"
echo "docker compose --env-file .env down"

if [[ "$FOLLOW_LOGS" == "true" ]]; then
  step "Mostrando logs de backend y frontend"
  docker compose --env-file .env logs -f personalfit-backend personalfit-frontend
fi
