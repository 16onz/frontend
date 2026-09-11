/**
 * API.md(백엔드와 공유하는 계약)를 그대로 타입으로 옮긴 파일.
 *
 * 여기가 프론트엔드에서 "백엔드가 무엇을 주고받는가"를 아는 유일한 곳이다.
 * API.md 가 바뀌면 이 파일을 먼저 고치면 되고, 그러면 타입 검사기가
 * 영향을 받는 화면들을 전부 짚어 준다. (필드 이름이 바뀌었는데 화면이
 * 조용히 빈칸이 되는 사고를 막는 것이 TypeScript 를 쓰는 가장 큰 이유다.)
 */

/* ── GET /api/menu ─────────────────────────────────────────── */

/** single → 라디오(한 개만), multi → 체크박스(여러 개) */
export type OptionGroupType = 'single' | 'multi';

export interface OptionChoice {
  id: string;
  name: string;
  /** 기본가에 더해지는 금액. 0 일 수 있다. */
  extraPrice: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  type: OptionGroupType;
  /** true 면 선택하지 않은 주문은 서버가 400 으로 거절한다. */
  required: boolean;
  choices: OptionChoice[];
}

export interface Menu {
  id: string;
  name: string;
  /** 화면 그룹핑용. 커피 / 논커피 / 에이드 / 디저트 */
  category: string;
  basePrice: number;
  description: string;
  /** 빈 배열일 수 있다 (예: 초코 케이크). 메뉴마다 구성이 다르므로 반드시 순회해서 그린다. */
  optionGroups: OptionGroup[];
}

export interface MenuResponse {
  menus: Menu[];
}

/* ── POST /api/orders (요청) ───────────────────────────────── */

/**
 * 키는 optionGroup.id, 값의 타입은 그룹의 type 을 따른다.
 *   single → string       ("temp": "ice")
 *   multi  → string[]     ("extra": ["shot", "whip"])
 * 고르지 않은 선택적 그룹은 키를 아예 넣지 않는다.
 * (값에 undefined 를 허용하는 것은 "아직 안 고른 그룹"을 화면 상태에서 표현하기 위해서다.
 *  서버로 보낼 때는 toRequestOptions() 가 그런 키를 걸러 낸다.)
 */
export type OptionSelection = Record<string, string | string[] | undefined>;

/** 서버로 보내는 주문 항목. 금액 필드는 의도적으로 없다 — 가격은 서버가 계산한다. */
export interface OrderRequestItem {
  menuId: string;
  quantity: number;
  options: OptionSelection;
}

/* ── POST /api/orders (응답 201) ───────────────────────────── */

/** 요청과 달리 평탄화되어 내려온다. 순서는 메뉴에 정의된 그룹 순서. */
export interface OrderedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  extraPrice: number;
}

export interface OrderedItem {
  menuId: string;
  menuName: string;
  quantity: number;
  options: OrderedOption[];
  /** basePrice + 선택한 모든 extraPrice (1개당 가격) */
  unitPrice: number;
  /** unitPrice × quantity */
  lineTotal: number;
}

export interface Order {
  /** A-001 부터 1씩 증가 */
  orderNo: string;
  /** ISO 8601 UTC 문자열 */
  orderedAt: string;
  status: 'accepted';
  items: OrderedItem[];
  totalCount: number;
  totalPrice: number;
}

/* ── 에러 응답 ─────────────────────────────────────────────── */

export type ApiErrorCode =
  | 'EMPTY_ORDER'
  | 'MENU_NOT_FOUND'
  | 'INVALID_QUANTITY'
  | 'MISSING_REQUIRED_OPTION'
  | 'INVALID_OPTION'
  | 'INVALID_JSON'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  /** 서버에 닿지도 못한 경우 — 백엔드가 정의한 코드가 아니라 프론트가 붙인 값 */
  | 'NETWORK_ERROR';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/* ── 화면 전용 타입 (서버와 주고받지 않는다) ───────────────── */

/**
 * 장바구니 한 줄.
 *
 * lineId 가 따로 있는 이유: 같은 메뉴를 옵션만 다르게 두 번 담을 수 있어야 하므로
 * menuId 를 React key 로 쓰면 안 된다. (아메리카노 ICE 와 아메리카노 HOT 이 한 줄로 합쳐진다.)
 */
export interface CartLine {
  lineId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  options: OptionSelection;
  /** "ICE / Grande / 샷 추가" — 화면 표시용 요약 */
  optionSummary: string;
  /** 1개당 미리보기 가격. 어디까지나 미리보기이고, 진짜 금액은 주문 응답을 쓴다. */
  previewUnitPrice: number;
}
