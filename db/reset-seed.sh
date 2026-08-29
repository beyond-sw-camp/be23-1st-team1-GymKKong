#!/usr/bin/env bash
# 개발용 데이터 초기화 + 시드 재적재.
# E2E 테스트가 매번 같은 상태에서 시작하도록 쓴다.
#
#   bash db/reset-seed.sh
#
# docker-compose.yml의 gymkkong-mariadb 컨테이너가 떠 있어야 한다.
set -euo pipefail

CONTAINER="${DB_CONTAINER:-gymkkong-mariadb}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "오류: '$CONTAINER' 컨테이너가 떠 있지 않습니다. docker compose up -d 를 먼저 실행하세요." >&2
  exit 1
fi

run_sql() {
  docker exec -i "$CONTAINER" mariadb -ugymkkong -pgymkkong 2>/dev/null < "$1"
}

echo "[1/2] 데이터 초기화 (00_reset.sql)"
run_sql "$DIR/v2/00_reset.sql"

echo "[2/2] 시드 적재 (02_seed.sql)"
run_sql "$DIR/v2/02_seed.sql"

docker exec -i "$CONTAINER" mariadb -ugymkkong -pgymkkong gymkkong_v2 \
  -e "SELECT (SELECT COUNT(*) FROM app_user) AS users, (SELECT COUNT(*) FROM place) AS places, (SELECT COUNT(*) FROM class_session) AS sessions, (SELECT COUNT(*) FROM reservation) AS reservations;" 2>/dev/null

echo "완료."
