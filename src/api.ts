import type { ApiErrorBody, ApiErrorCode, Menu, MenuResponse, Order, OrderRequestItem } from './types';

/**
 * 백엔드와 통신하는 유일한 파일.
 *
 * 화면 컴포넌트는 fetch 도, 응답 형태도, 에러 포맷도 모른다.
 * API.md 의 `{ "error": { "code", "message" } }` 를 해석하는 곳도 여기 한 군데뿐이다.
 *
 * 경로는 '/api/...' 상대경로다. vite.config.ts 의 프록시가 localhost:4000 으로 넘겨준다.
 */

const BASE_URL = '/api';

/** 서버가 내려준 code 를 그대로 들고 다니는 에러. 화면에서 code 로 분기할 수 있다. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly status: number;

  constructor(code: ApiErrorCode | string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    // fetch 자체가 실패 = 서버가 꺼져 있거나 주소가 틀렸다. 응답 본문이 없다.
    throw new ApiError(
      'NETWORK_ERROR',
      '백엔드 서버에 연결할 수 없습니다. backend 폴더에서 `npm run dev` 로 서버를 켰는지 확인해 주세요. (http://localhost:4000)',
      0,
    );
  }

  if (!res.ok) {
    // 에러 응답은 항상 { error: { code, message } } 형태다. 다만 서버가 죽는 등
    // 형태를 못 지킬 수도 있으니 파싱 실패까지 대비해 둔다.
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body?.error?.code ?? 'INTERNAL_ERROR',
      body?.error?.message ?? `요청에 실패했습니다. (HTTP ${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

/** 메뉴 카탈로그 전체. 앱 시작 시 한 번만 부르면 된다. */
export async function fetchMenu(): Promise<Menu[]> {
  const data = await request<MenuResponse>('/menu');
  return data.menus;
}

/**
 * 주문 생성.
 *
 * 보내는 것은 menuId / 옵션 id / 수량뿐이다. **금액은 절대 넣지 않는다.**
 * 프론트가 보낸 금액을 서버가 믿으면 브라우저에서 값을 고쳐 1원짜리 주문을 넣을 수 있다.
 */
export async function createOrder(items: OrderRequestItem[]): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}

/** 연동 디버깅용. 화면에서는 쓰지 않지만 콘솔에서 확인할 때 편하다. */
export async function checkHealth(): Promise<{ status: string; uptime: number }> {
  return request<{ status: string; uptime: number }>('/health');
}
