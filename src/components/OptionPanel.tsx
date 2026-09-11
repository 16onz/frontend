import { useEffect, useState } from 'react';
import type { CartLine, Menu, OptionGroup, OptionSelection } from '../types';
import {
  MAX_QUANTITY,
  MIN_QUANTITY,
  clampQuantity,
  createLineId,
  findMissingRequiredGroup,
  formatPrice,
  initialSelection,
  resolveSelection,
  toRequestOptions,
} from '../utils';

interface Props {
  menu: Menu;
  onAdd: (line: CartLine) => void;
  onClose: () => void;
}

/**
 * 옵션 선택 패널 (모달).
 *
 * 핵심: **optionGroups 를 순회해서 그린다.** temp / size 같은 특정 그룹 id 를
 * 직접 참조하지 않는다. 자몽 에이드에는 온도 그룹이 없고 초코 케이크에는 옵션이 아예 없는데,
 * 그런 메뉴들도 이 코드 한 벌로 똑같이 그려진다.
 */
export default function OptionPanel({ menu, onAdd, onClose }: Props) {
  const [selection, setSelection] = useState<OptionSelection>(() => initialSelection(menu));
  const [quantity, setQuantity] = useState(1);

  // 다른 메뉴가 열리면 선택 상태를 처음부터 다시 잡는다.
  useEffect(() => {
    setSelection(initialSelection(menu));
    setQuantity(1);
  }, [menu]);

  // ESC 로 닫기
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const { previewUnitPrice, summary } = resolveSelection(menu, selection);
  const missingGroup = findMissingRequiredGroup(menu, selection);

  function pickSingle(group: OptionGroup, choiceId: string) {
    setSelection((prev) => ({ ...prev, [group.id]: choiceId }));
  }

  function toggleMulti(group: OptionGroup, choiceId: string, checked: boolean) {
    setSelection((prev) => {
      const current = prev[group.id];
      const ids = Array.isArray(current) ? current : [];
      return {
        ...prev,
        // 중복 선택은 백엔드가 INVALID_OPTION 으로 거절하므로 filter 로 확실히 한 번만 담는다.
        [group.id]: checked ? [...ids, choiceId] : ids.filter((id) => id !== choiceId),
      };
    });
  }

  function handleAdd() {
    if (missingGroup) return;

    onAdd({
      lineId: createLineId(),
      menuId: menu.id,
      menuName: menu.name,
      quantity,
      options: toRequestOptions(menu, selection),
      optionSummary: summary,
      previewUnitPrice,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="option-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${menu.name} 옵션 선택`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="option-panel__head">
          <div>
            <h2 className="option-panel__title">{menu.name}</h2>
            <p className="option-panel__desc">{menu.description}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="option-panel__body">
          {menu.optionGroups.length === 0 ? (
            <p className="option-panel__empty">선택할 옵션이 없는 메뉴입니다. 수량만 정해 주세요.</p>
          ) : (
            menu.optionGroups.map((group) => (
              <fieldset key={group.id} className="option-group">
                <legend className="option-group__legend">
                  {group.name}
                  {group.required ? (
                    <span className="badge badge--required">필수</span>
                  ) : (
                    <span className="badge">선택</span>
                  )}
                </legend>

                <div className="option-choices">
                  {/* 선택적 single 그룹은 "선택 안 함" 으로 되돌릴 수 있어야 한다 (예: 우유 변경) */}
                  {group.type === 'single' && !group.required && (
                    <label className="option-choice">
                      <input
                        type="radio"
                        name={`${menu.id}-${group.id}`}
                        checked={selection[group.id] === '' || selection[group.id] === undefined}
                        onChange={() => pickSingle(group, '')}
                      />
                      <span className="option-choice__name">선택 안 함</span>
                    </label>
                  )}

                  {group.choices.map((choice) => {
                    const current = selection[group.id];
                    const checked =
                      group.type === 'multi'
                        ? Array.isArray(current) && current.includes(choice.id)
                        : current === choice.id;

                    return (
                      <label key={choice.id} className="option-choice">
                        <input
                          type={group.type === 'multi' ? 'checkbox' : 'radio'}
                          name={`${menu.id}-${group.id}`}
                          checked={checked}
                          onChange={(event) =>
                            group.type === 'multi'
                              ? toggleMulti(group, choice.id, event.target.checked)
                              : pickSingle(group, choice.id)
                          }
                        />
                        <span className="option-choice__name">{choice.name}</span>
                        {choice.extraPrice > 0 && (
                          <span className="option-choice__extra">+{formatPrice(choice.extraPrice)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}

          <div className="quantity">
            <span className="quantity__label">수량</span>
            <div className="quantity__control">
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                disabled={quantity <= MIN_QUANTITY}
                aria-label="수량 줄이기"
              >
                −
              </button>
              <span className="quantity__value">{quantity}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                disabled={quantity >= MAX_QUANTITY}
                aria-label="수량 늘리기"
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        <footer className="option-panel__foot">
          <div className="option-panel__preview">
            {/* 미리보기 표시. 결제되는 금액은 서버가 계산해 주문 응답으로 내려준다. */}
            <span className="option-panel__preview-label">예상 금액 (미리보기)</span>
            <strong className="option-panel__preview-price">{formatPrice(previewUnitPrice * quantity)}</strong>
          </div>
          <button type="button" className="button button--primary" onClick={handleAdd} disabled={!!missingGroup}>
            {missingGroup ? `${missingGroup}을(를) 선택해 주세요` : '장바구니에 담기'}
          </button>
        </footer>
      </div>
    </div>
  );
}
