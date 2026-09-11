import type { Menu, OptionChoice, OptionSelection } from './types';

/** 12,500원 */
export function formatPrice(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`;
}

/** ISO 문자열 → 2026. 9. 11. 오후 4:18:59 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('ko-KR');
}

/**
 * 화면에서 고른 옵션을 "메뉴에 정의된 순서대로" 펼친다.
 *
 * 서버도 같은 순서로 응답을 만들기 때문에(pricing.js), 미리보기와 주문 완료 화면의
 * 옵션 나열 순서가 어긋나지 않는다.
 *
 * ⚠️ 여기서 계산하는 가격은 **미리보기 전용**이다. 진짜 금액은 주문 응답의
 * unitPrice / lineTotal / totalPrice 를 쓴다. (가격은 서버가 계산한다 — API.md 설계 규칙 1)
 */
export function resolveSelection(menu: Menu, selection: OptionSelection) {
  const choices: Array<{ groupName: string; choice: OptionChoice }> = [];

  for (const group of menu.optionGroups) {
    const picked = selection[group.id];
    if (picked === undefined || picked === '') continue;

    const ids = Array.isArray(picked) ? picked : [picked];
    for (const id of ids) {
      const choice = group.choices.find((c) => c.id === id);
      if (choice) choices.push({ groupName: group.name, choice });
    }
  }

  const previewUnitPrice = choices.reduce((sum, { choice }) => sum + choice.extraPrice, menu.basePrice);
  const summary = choices.map(({ choice }) => choice.name).join(' / ');

  return { choices, previewUnitPrice, summary };
}

/**
 * 화면 상태(selection)를 서버가 받는 형태로 정리한다.
 *
 * - 고르지 않은 선택적 그룹('' 이거나 빈 배열)은 **키 자체를 뺀다.**
 *   백엔드는 메뉴에 없는 키나 빈 문자열을 INVALID_OPTION 으로 거절하기 때문이다.
 */
export function toRequestOptions(menu: Menu, selection: OptionSelection): OptionSelection {
  const options: OptionSelection = {};

  for (const group of menu.optionGroups) {
    const picked = selection[group.id];

    if (group.type === 'multi') {
      const ids = Array.isArray(picked) ? picked : [];
      if (ids.length > 0) options[group.id] = ids;
      continue;
    }

    if (typeof picked === 'string' && picked !== '') options[group.id] = picked;
  }

  return options;
}

/** 필수 그룹을 전부 골랐는지. 서버도 검사하지만, 400 을 받기 전에 버튼을 막아 준다. */
export function findMissingRequiredGroup(menu: Menu, selection: OptionSelection): string | null {
  for (const group of menu.optionGroups) {
    if (!group.required) continue;

    const picked = selection[group.id];
    const empty = picked === undefined || picked === '' || (Array.isArray(picked) && picked.length === 0);
    if (empty) return group.name;
  }
  return null;
}

/**
 * 옵션 기본값.
 * 필수 single 그룹은 첫 choice 를 미리 골라 둔다(예: 온도 HOT, 사이즈 Tall).
 * 선택적 그룹은 비워 두어 "선택 안 함" 이 기본이 되게 한다.
 */
export function initialSelection(menu: Menu): OptionSelection {
  const selection: OptionSelection = {};

  for (const group of menu.optionGroups) {
    if (group.type === 'multi') {
      selection[group.id] = [];
    } else {
      selection[group.id] = group.required ? (group.choices[0]?.id ?? '') : '';
    }
  }

  return selection;
}

/** crypto.randomUUID 가 없는 환경(구형 브라우저·http 오리진)을 위한 대비책 */
export function createLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const MIN_QUANTITY = 1;
/** 백엔드의 INVALID_QUANTITY 기준과 같은 값 (API.md: 1~20) */
export const MAX_QUANTITY = 20;

export function clampQuantity(value: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(value)));
}
