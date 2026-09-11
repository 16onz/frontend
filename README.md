# 커피숍 운영 시뮬레이터 — 프론트엔드

메뉴를 고르고 옵션을 선택해 장바구니에 담은 뒤 주문하면, **주문번호와 주문내역**을 보여 주는 화면입니다.
백엔드는 별도 저장소([16onz/backend](https://github.com/16onz/backend))에 있습니다.

📄 **API 명세는 [API.md](./API.md) 를 보세요.** 백엔드 담당과 공유하는 계약 문서이며, 두 저장소에 같은 사본이 있습니다.

## 실행

백엔드를 **먼저** 켜 두고 시작하세요.

```bash
# 터미널 1 — 백엔드 (../backend)
npm install
npm run dev        # http://localhost:4000

# 터미널 2 — 프론트엔드 (여기)
npm install
npm run dev        # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 을 엽니다.

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (5173, `/api` 는 4000 으로 프록시) |
| `npm run build` | 타입 검사 후 `dist/` 로 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | 타입 검사만 |

> 백엔드가 꺼져 있어도 앱은 흰 화면으로 죽지 않고 **"백엔드 서버에 연결할 수 없습니다"** 배너와
> `다시 시도` 버튼을 보여 줍니다. 백엔드를 켠 뒤 그 버튼을 누르면 됩니다.

## 기술 스택

- React 18 + Vite + TypeScript
- 상태관리 라이브러리 없음 — `useState` 만 사용합니다. 화면이 두 개(`menu` / `complete`)뿐이라 라우터도 두지 않았습니다.
- CSS 프레임워크 없음 — `src/styles.css` 순수 CSS 한 장입니다.
- 런타임 의존성은 `react`, `react-dom` 둘 뿐입니다.

## 폴더 구조

```
src/
  main.tsx                앱 진입점
  App.tsx                 화면 전환 + 장바구니 상태 (상태는 전부 여기 모여 있다)
  api.ts                  ★ 백엔드와 통신하는 유일한 파일
  types.ts                ★ API.md 를 그대로 옮긴 타입 — 계약의 코드판
  utils.ts                가격 포맷 · 옵션 선택 → 요청 변환 · 미리보기 계산
  styles.css
  components/
    MenuList.tsx          카테고리별 그룹핑
    MenuCard.tsx          메뉴 한 장
    OptionPanel.tsx       옵션 선택 모달 (라디오/체크박스 + 수량 + 담기)
    Cart.tsx              담은 항목 · 합계 · 주문하기
    OrderComplete.tsx     주문번호 · 주문내역
```

고칠 일이 생기면 대부분 **`api.ts`(통신)** 또는 **`OptionPanel.tsx`(옵션 UI)** 입니다.

## 설계 규칙 (백엔드와 합의한 내용)

1. **가격은 서버가 계산합니다.** 요청 본문에는 `menuId` / 옵션 id / `quantity` 만 담습니다.
   화면에 보이는 금액은 전부 **미리보기**이고, 주문 완료 화면은 서버 응답의 `unitPrice` / `lineTotal` / `totalPrice` 를 그대로 씁니다.
   `App.tsx` 의 `submitOrder()` 에서 화면 전용 필드(`lineId`, `menuName`, `previewUnitPrice` …)를 걷어내고 보냅니다.
2. **메뉴를 하드코딩하지 않습니다.** `GET /api/menu` 로 받아 렌더하므로, 백엔드가 `data/menu.js` 에 메뉴를 추가하면
   이 저장소를 고치지 않아도 화면에 나타납니다. 카테고리 목록조차 응답에서 뽑아냅니다.
3. **옵션 UI 는 `optionGroups` 를 순회해서 그립니다.** `temp` / `size` 같은 특정 그룹 id 를 직접 참조하지 않습니다.
   - `choco-cake` → `optionGroups: []` → 옵션 영역 없이 수량만
   - `grapefruit-ade` → 온도 그룹이 아예 없음 (ICE 전용)
   - 즉 "모든 메뉴에 온도가 있다"고 가정한 코드는 이 두 메뉴에서 바로 깨집니다.
4. **id → 이름 매핑을 다시 하지 않습니다.** 주문 응답에 `menuName` / `groupName` / `choiceName` 이 모두 들어 있어
   `item.options.map(o => o.choiceName).join(' / ')` 로 바로 그립니다.
5. **에러 포맷은 `api.ts` 한 곳에서만 해석합니다.** `{ error: { code, message } }` 를 `ApiError` 로 바꿔 던지고,
   화면은 `message` 를 그대로 보여 줍니다. 서버에 닿지도 못한 경우(`fetch` 실패)는 `NETWORK_ERROR` 로 구분합니다.

## 알아 둘 구현 포인트

- **`lineId`** — 장바구니 줄의 key 는 `menuId` 가 아니라 `crypto.randomUUID()` 로 만든 `lineId` 입니다.
  같은 메뉴를 옵션만 다르게 두 번 담을 수 있어야 하는데, `menuId` 를 key 로 쓰면 두 줄이 합쳐져 버립니다.
- **선택적 single 그룹** — 카페라떼의 `우유 변경` 처럼 `required: false` 인 single 그룹에는
  `선택 안 함` 라디오를 하나 더 그립니다. 안 그러면 한 번 고른 뒤 되돌릴 방법이 없습니다.
- **빈 값은 키째 뺍니다** — 고르지 않은 선택적 그룹은 `""` / `[]` 가 아니라 **키 자체를 넣지 않고** 보냅니다
  (`utils.ts` 의 `toRequestOptions`). 백엔드는 메뉴에 없는 키나 잘못된 값을 `INVALID_OPTION` 으로 거절합니다.
- **수량 1~20** — 백엔드의 `INVALID_QUANTITY` 기준과 같은 값을 `utils.ts` 에 상수로 두고 버튼을 막습니다.
  서버도 검사하지만, 400 을 받기 전에 화면에서 먼저 막는 편이 낫습니다.
- **필수 옵션 미선택** — `담기` 버튼이 비활성화되고 버튼 글씨가 `사이즈를 선택해 주세요` 로 바뀝니다.
- **주문 실패 시 장바구니를 비우지 않습니다.** 에러 배너만 띄우고 그대로 두어 고친 뒤 다시 누를 수 있게 합니다.

## 동작 확인

1. `http://localhost:5173` → 메뉴가 카테고리별(커피/논커피/에이드/디저트)로 보인다
2. 아메리카노 → 온도·사이즈 라디오, 추가 선택 체크박스. 고를 때마다 하단 예상 금액이 바뀐다
3. ICE + Grande + 샷 추가, 수량 2 → `담기` → 장바구니 1줄, 10,000원
4. 초코 케이크 → 옵션 영역 없이 수량만 뜬다 → 장바구니 2줄, 16,000원
5. **아메리카노를 HOT/Tall 로 한 번 더 담기** → 앞 줄과 합쳐지지 않고 별도 줄로 남는다
6. `주문하기` → 주문번호 `A-001` 과 3줄의 내역·옵션 이름이 표시된다
7. 개발자도구 Network 에서 `POST /api/orders` 요청 본문에 **금액 필드가 없는지** 확인한다
8. `새 주문하기` → 빈 장바구니로 복귀 → 다시 주문하면 `A-002`
9. 브라우저 폭을 400px 로 줄여도 가로 스크롤이 생기지 않는다

백엔드를 끈 채로 새로고침하면 에러 배너가 뜨는지도 함께 확인하세요.

## 백엔드 담당에게

- 요청은 전부 `/api/...` 상대경로로 나갑니다. `vite.config.ts` 의 프록시가 `http://localhost:4000` 으로 넘깁니다.
- 응답 필드 이름이 바뀌면 화면이 조용히 빈칸이 됩니다. **API.md 를 먼저 고치고 알려 주세요.**
  `src/types.ts` 를 그에 맞춰 고치면 타입 검사기가 영향받는 화면을 전부 짚어 줍니다.
