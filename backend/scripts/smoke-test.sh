#!/usr/bin/env bash
# GymKKong API 스모크 테스트 — 예약 핵심 플로우 검증
set -u
API=http://localhost:8090
PASS=0; FAIL=0

ok()   { echo "  PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL  $1"; echo "        got: $2"; FAIL=$((FAIL+1)); }
jqv()  { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const p='$1'.split('.');let v=d;for(const k of p){v=v?.[k]};console.log(v??'')" 2>/dev/null; }

echo "== 1. 로그인 (회원 kim) =="
LOGIN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"gymkkong1234","deviceId":"smoke-test"}')
TOKEN=$(echo "$LOGIN" | jqv accessToken)
ROLE=$(echo "$LOGIN" | jqv user.role)
[ -n "$TOKEN" ] && ok "액세스 토큰 발급 (role=$ROLE)" || bad "로그인" "$LOGIN"
AUTH="Authorization: Bearer $TOKEN"

echo "== 2. 잘못된 비밀번호는 거부 =="
BADPW=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"wrongwrong"}')
[ "$(echo "$BADPW" | jqv code)" = "LOGIN_FAILED" ] && ok "LOGIN_FAILED 반환" || bad "잘못된 비번" "$BADPW"

echo "== 3. 지점 목록 (비로그인 허용) =="
PLACES=$(curl -s "$API/api/places?keyword=%EC%A7%90%EA%BD%81")
PCOUNT=$(echo "$PLACES" | jqv totalElements)
[ "$PCOUNT" = "3" ] && ok "지점 3건 조회" || bad "지점 검색" "$PLACES"

echo "== 4. 내 주변 지점 (좌표) =="
NEAR=$(curl -s "$API/api/places/nearby?lat=37.5006&lng=127.0365&radiusKm=5")
NEARNAME=$(echo "$NEAR" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d[0]?.name??'')")
[ "$NEARNAME" = "짐꽁 강남점" ] && ok "가장 가까운 지점 = $NEARNAME" || bad "주변 지점" "$NEAR"

echo "== 5. 시간표 조회 (내 예약 표시 포함) =="
TT=$(curl -s -H "$AUTH" "$API/api/places/1/sessions?days=7")
SID=$(echo "$TT" | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
const s=d.find(x=>!x.reservedByMe && x.remainSeat>0 && x.status==='SCHEDULED');
console.log(s?s.id:'')")
TTN=$(echo "$TT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).length)")
[ -n "$SID" ] && ok "예약 가능한 회차 발견 (총 $TTN건 중 sessionId=$SID)" || bad "시간표" "$TT"

echo "== 6. 예약 전 이용권 잔여 확인 =="
MS=$(curl -s -H "$AUTH" $API/api/me/memberships)
BEFORE=$(echo "$MS" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const m=d.find(x=>x.status==='ACTIVE');console.log(m?m.remainCount:'')")
echo "        잔여: $BEFORE"

echo "== 7. 수업 예약 =="
RES=$(curl -s -X POST $API/api/reservations -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SID}")
RID=$(echo "$RES" | jqv id)
RREMAIN=$(echo "$RES" | jqv membershipRemainCount)
[ -n "$RID" ] && ok "예약 생성 (id=$RID, 이용권 잔여 $BEFORE -> $RREMAIN)" || bad "예약" "$RES"
[ "$RREMAIN" = "$((BEFORE-1))" ] && ok "예약 시점에 이용권 1회 차감됨" || bad "이용권 차감" "before=$BEFORE after=$RREMAIN"

echo "== 8. 중복 예약 거부 =="
DUP=$(curl -s -X POST $API/api/reservations -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SID}")
[ "$(echo "$DUP" | jqv code)" = "ALREADY_RESERVED" ] && ok "ALREADY_RESERVED 반환" || bad "중복 예약" "$DUP"

echo "== 9. 정원 반영 확인 =="
SESS=$(curl -s -H "$AUTH" $API/api/sessions/$SID)
RC=$(echo "$SESS" | jqv reservedCount)
MINE=$(echo "$SESS" | jqv reservedByMe)
[ "$MINE" = "true" ] && ok "reservedByMe=true, reservedCount=$RC" || bad "정원 반영" "$SESS"

echo "== 10. 예약 취소 -> 이용권 복원 =="
curl -s -o /dev/null -w "" -X DELETE $API/api/reservations/$RID -H "$AUTH"
MS2=$(curl -s -H "$AUTH" $API/api/me/memberships)
AFTER=$(echo "$MS2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const m=d.find(x=>x.status==='ACTIVE');console.log(m?m.remainCount:'')")
[ "$AFTER" = "$BEFORE" ] && ok "취소 후 이용권 복원 ($RREMAIN -> $AFTER)" || bad "이용권 복원" "expected=$BEFORE got=$AFTER"

echo "== 11. 비로그인 예약 차단 =="
NOAUTH=$(curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/reservations \
  -H 'Content-Type: application/json' -d "{\"sessionId\":$SID}")
[ "$NOAUTH" = "401" ] && ok "401 반환" || bad "비인증 예약" "HTTP $NOAUTH"

echo "== 12. 회원이 관리자 API 접근 차단 =="
ADM=$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" $API/api/admin/members)
[ "$ADM" = "403" ] && ok "403 반환" || bad "권한 분리" "HTTP $ADM"

echo "== 13. 트레이너 로그인 + 예약자 명단 =="
TLOGIN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"choi.trainer@gymkkong.com","password":"gymkkong1234"}')
TTOK=$(echo "$TLOGIN" | jqv accessToken)
TAUTH="Authorization: Bearer $TTOK"
TSESS=$(curl -s -H "$TAUTH" "$API/api/trainer/sessions?days=7")
TSN=$(echo "$TSESS" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).length)")
[ -n "$TTOK" ] && ok "트레이너 로그인, 내 수업 ${TSN}건" || bad "트레이너 로그인" "$TLOGIN"

echo "== 14. 트레이너 댓글 작성 (v1에서 불가능했던 기능) =="
CM=$(curl -s -X POST $API/api/posts/1/comments -H "$TAUTH" -H 'Content-Type: application/json' \
  --data-binary @body_comment.json)
CROLE=$(echo "$CM" | jqv authorRole)
[ "$CROLE" = "TRAINER" ] && ok "트레이너가 댓글 작성 성공 (authorRole=$CROLE)" || bad "트레이너 댓글" "$CM"

echo "== 15. 회원이 공지 작성 시도 -> 거부 =="
NOTICE=$(curl -s -X POST $API/api/places/1/posts -H "$AUTH" -H 'Content-Type: application/json' \
  --data-binary @body_notice.json)
[ "$(echo "$NOTICE" | jqv code)" = "FORBIDDEN" ] && ok "FORBIDDEN 반환" || bad "공지 권한" "$NOTICE"

echo "== 16. 환불 흐름: 이미 환불된 이용권 재환불 거부 (v1 미해결 이슈) =="
YLOGIN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"yoon@example.com","password":"gymkkong1234"}')
YTOK=$(echo "$YLOGIN" | jqv accessToken)
YMS=$(curl -s -H "Authorization: Bearer $YTOK" $API/api/me/memberships)
YMID=$(echo "$YMS" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const m=d.find(x=>x.status==='REFUNDED');console.log(m?m.id:'')")
RF=$(curl -s -X POST $API/api/me/memberships/$YMID/refund -H "Authorization: Bearer $YTOK" \
  -H 'Content-Type: application/json' --data-binary @body_refund.json)
RFMSG=$(echo "$RF" | jqv message)
[ "$(echo "$RF" | jqv code)" = "MEMBERSHIP_NOT_REFUNDABLE" ] && ok "거부: $RFMSG" || bad "재환불 차단" "$RF"

echo
echo "=============================="
echo " PASS: $PASS   FAIL: $FAIL"
echo "=============================="
[ $FAIL -eq 0 ]
