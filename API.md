# 커피숍 운영 시뮬레이터 — API 명세

> **이 문서는 프론트엔드/백엔드가 공유하는 계약(contract)입니다.**
> `16onz/backend` 와 `16onz/frontend` 두 저장소에 같은 내용의 사본을 둡니다.
> 변경이 필요하면 **코드를 먼저 고치지 말고** 상대에게 알린 뒤 양쪽 사본을 함께 수정하세요.

- Base URL: `http://localhost:4000`
- 요청/응답 형식: `application/json; charset=utf-8`
- CORS: 모든 오리진 허용 (연습용). Vite 프록시를 써도 되고 직접 호출해도 됩니다.

## 설계 규칙

1. **가격은 서버가 계산합니다.** 프론트는 `menuId` / 옵션 id / 수량만 보냅니다.
   요청 본문에 금액 필드를 넣지 마세요. 화면의 가격 표시는 어디까지나 미리보기입니다.
2. **메뉴 카탈로그의 단일 진실 공급원은 서버입니다.** 프론트에 메뉴를 하드코딩하지 말고
   `GET /api/menu` 로 받아 렌더하세요. 메뉴가 추가되어도 프론트 코드를 고칠 필요가 없습니다.
3. **응답에 표시용 이름이 모두 들어 있습니다.** 주문 응답만으로
   "아메리카노 / ICE / Grande / 샷 추가" 를 그릴 수 있으므로 프론트에서 id → 이름 매핑을 다시 하지 마세요.
4. **모든 실패 응답은 한 가지 형태입니다.** → `{ "error": { "code", "message" } }`

---

## 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 생존 확인 (연동 디버깅용) |
| GET | `/api/menu` | 메뉴 + 옵션 카탈로그 전체 |
| POST | `/api/orders` | 주문 생성 → 주문번호·내역·총액 반환 |

---

## GET /api/health

```json
{ "status": "ok", "uptime": 12 }
```

---

## GET /api/menu

메뉴와 옵션 구조를 한 번에 내려줍니다. 앱 시작 시 한 번만 호출하면 됩니다.

### 응답 200

```json
{
  "menus": [
    {
      "id": "americano",
      "name": "아메리카노",
      "category": "커피",
      "basePrice": 4000,
      "description": "깔끔한 산미의 에스프레소에 물을 더한 기본 메뉴",
      "optionGroups": [
        {
          "id": "temp",
          "name": "온도",
          "type": "single",
          "required": true,
          "choices": [
            { "id": "hot", "name": "HOT", "extraPrice": 0 },
            { "id": "ice", "name": "ICE", "extraPrice": 0 }
          ]
        },
        {
          "id": "size",
          "name": "사이즈",
          "type": "single",
          "required": true,
          "choices": [
            { "id": "tall",   "name": "Tall",   "extraPrice": 0 },
            { "id": "grande", "name": "Grande", "extraPrice": 500 },
            { "id": "venti",  "name": "Venti",  "extraPrice": 1000 }
          ]
        },
        {
          "id": "extra",
          "name": "추가 선택",
          "type": "multi",
          "required": false,
          "choices": [
            { "id": "shot",  "name": "샷 추가",     "extraPrice": 500 },
            { "id": "syrup", "name": "바닐라 시럽", "extraPrice": 300 },
            { "id": "whip",  "name": "휘핑크림",    "extraPrice": 500 }
          ]
        }
      ]
    }
  ]
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|---|---|---|
| `menus[].id` | string | 주문 시 `menuId` 로 보낼 값 |
| `menus[].category` | string | 화면 그룹핑용. 현재 `커피` / `논커피` / `에이드` / `디저트` |
| `menus[].basePrice` | number | 옵션을 하나도 안 골랐을 때의 가격 (원) |
| `menus[].optionGroups` | array | **빈 배열일 수 있습니다** (예: 초코 케이크) |
| `optionGroups[].type` | `"single"` \| `"multi"` | `single` → 라디오 버튼 / `multi` → 체크박스 |
| `optionGroups[].required` | boolean | `true` 면 선택하지 않은 주문은 400 으로 거절됩니다 |
| `choices[].extraPrice` | number | 기본가에 **더해지는** 금액 (0 일 수 있음) |

### 프론트가 알아야 할 점

- **옵션 그룹 구성은 메뉴마다 다릅니다.** 특정 그룹이 항상 있다고 가정하지 마세요.
  - `choco-cake` → `optionGroups: []` (옵션 UI 자체를 그리지 않음)
  - `grapefruit-ade` → ICE 전용이라 `temp` 그룹이 아예 없음
- 그러므로 `optionGroups` 를 **순회해서** UI 를 그려야 하고, `temp` / `size` 를 직접 참조하면 안 됩니다.
- 현재 메뉴 7종: `americano`, `cafe-latte`, `vanilla-latte`, `cappuccino`, `green-tea-latte`, `grapefruit-ade`, `choco-cake`

---

## POST /api/orders

### 요청

```json
{
  "items": [
    {
      "menuId": "americano",
      "quantity": 2,
      "options": { "temp": "ice", "size": "grande", "extra": ["shot"] }
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `items` | array | ✅ | 최소 1개. 비어 있으면 `EMPTY_ORDER` |
| `items[].menuId` | string | ✅ | `GET /api/menu` 의 `menus[].id` |
| `items[].quantity` | number | ✅ | **1~20 사이의 정수** |
| `items[].options` | object | ⬜ | 생략 시 `{}` 로 간주. 키는 `optionGroup.id` |

`options` 값의 타입은 그룹의 `type` 을 따릅니다.

- `type: "single"` → **문자열** (`"temp": "ice"`) — 배열을 보내면 `INVALID_OPTION`
- `type: "multi"` → **문자열 배열** (`"extra": ["shot", "whip"]`) — 문자열을 보내면 `INVALID_OPTION`
- 선택하지 않은 **선택적**(`required: false`) 그룹은 키를 생략하거나 `[]` 로 보냅니다.

> ⚠️ **메뉴에 없는 그룹 키를 보내면 거절됩니다.** (`"tmep"` 같은 오타를 조용히 무시하면
> "주문은 됐는데 옵션이 안 붙는" 버그로 이어지므로 일부러 400 으로 막습니다.)
> 같은 이유로 `multi` 그룹에 중복 값을 넣어도 거절됩니다.

### 응답 201

```json
{
  "orderNo": "A-001",
  "orderedAt": "2026-09-11T07:18:59.106Z",
  "status": "accepted",
  "items": [
    {
      "menuId": "americano",
      "menuName": "아메리카노",
      "quantity": 2,
      "options": [
        { "groupId": "temp",  "groupName": "온도",      "choiceId": "ice",    "choiceName": "ICE",    "extraPrice": 0 },
        { "groupId": "size",  "groupName": "사이즈",    "choiceId": "grande", "choiceName": "Grande", "extraPrice": 500 },
        { "groupId": "extra", "groupName": "추가 선택", "choiceId": "shot",   "choiceName": "샷 추가", "extraPrice": 500 }
      ],
      "unitPrice": 5000,
      "lineTotal": 10000
    }
  ],
  "totalCount": 2,
  "totalPrice": 10000
}
```

| 필드 | 설명 |
|---|---|
| `orderNo` | 주문번호. `A-001` 부터 1씩 증가, 3자리 zero-pad |
| `orderedAt` | ISO 8601 UTC 문자열. 화면에는 `toLocaleString('ko-KR')` 로 변환해 표시하세요 |
| `status` | 현재는 항상 `"accepted"` |
| `items[].options` | **요청과 달리 평탄화된 배열**입니다. 순서는 메뉴에 정의된 그룹 순서를 따르므로 그대로 이어 붙이면 됩니다 |
| `unitPrice` | `basePrice` + 선택한 모든 `extraPrice` 의 합 (1개당 가격) |
| `lineTotal` | `unitPrice × quantity` |
| `totalCount` | 전체 잔 수 (`quantity` 합계) |
| `totalPrice` | 전체 금액 |

> 주문 완료 화면의 옵션 요약은
> `item.options.map(o => o.choiceName).join(' / ')` 로 바로 만들 수 있습니다.

---

## 에러 응답

모든 실패는 아래 한 가지 형태로 내려갑니다.

```json
{ "error": { "code": "MENU_NOT_FOUND", "message": "존재하지 않는 메뉴입니다: 'latteee' (items[0])" } }
```

| code | status | 발생 조건 |
|---|---|---|
| `EMPTY_ORDER` | 400 | `items` 가 없거나 빈 배열 |
| `MENU_NOT_FOUND` | 400 | 존재하지 않는 `menuId` |
| `INVALID_QUANTITY` | 400 | 정수가 아니거나 1~20 범위 밖 |
| `MISSING_REQUIRED_OPTION` | 400 | `required: true` 그룹을 선택하지 않음 |
| `INVALID_OPTION` | 400 | 없는 그룹 키 / 없는 choice id / 타입 불일치 / 중복 선택 |
| `INVALID_JSON` | 400 | 요청 본문이 JSON 으로 파싱되지 않음 |
| `NOT_FOUND` | 404 | 정의되지 않은 경로 |
| `INTERNAL_ERROR` | 500 | 그 외 서버 오류 |

`message` 에는 **어느 항목의 어느 옵션이 문제인지**가 `(items[1].options.temp)` 형태로 들어 있습니다.
그대로 화면에 띄워도 되고, 개발 중에는 콘솔에 찍어 두면 디버깅이 빨라집니다.

### 프론트 에러 처리 예시

```js
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items }),
});

if (!res.ok) {
  const body = await res.json().catch(() => null);
  throw new Error(body?.error?.message ?? '주문에 실패했습니다.');
}

return res.json();
```

---

## 알아 둘 제약

- 주문은 **서버 메모리**에 저장됩니다. **서버를 재시작하면 주문 내역이 사라지고 주문번호도 `A-001` 로 리셋됩니다.**
- 주문 조회(`GET /api/orders/:orderNo`)와 관리자 화면은 이번 범위에 없습니다.
  필요해지면 이 문서를 먼저 고치고 나서 구현합니다.

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-09-11 | 최초 작성 (`/api/health`, `/api/menu`, `/api/orders`) |
