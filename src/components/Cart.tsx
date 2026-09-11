import type { CartLine } from '../types';
import { MAX_QUANTITY, MIN_QUANTITY, formatPrice } from '../utils';

interface Props {
  lines: CartLine[];
  submitting: boolean;
  onChangeQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  onSubmit: () => void;
}

/**
 * 장바구니.
 *
 * 같은 메뉴라도 옵션이 다르면 별도의 줄로 남는다 — key 가 menuId 가 아니라 lineId 인 이유.
 * 합계는 미리보기 값이고, 주문 버튼을 누르면 서버가 다시 계산한 금액이 완료 화면에 뜬다.
 */
export default function Cart({ lines, submitting, onChangeQuantity, onRemove, onSubmit }: Props) {
  const totalCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = lines.reduce((sum, line) => sum + line.previewUnitPrice * line.quantity, 0);

  return (
    <aside className="cart">
      <h2 className="cart__title">
        장바구니
        {lines.length > 0 && <span className="cart__count">{lines.length}</span>}
      </h2>

      {lines.length === 0 ? (
        <p className="cart__empty">메뉴를 골라 담아 주세요.</p>
      ) : (
        <ul className="cart__list">
          {lines.map((line) => (
            <li key={line.lineId} className="cart-line">
              <div className="cart-line__head">
                <span className="cart-line__name">{line.menuName}</span>
                <button
                  type="button"
                  className="cart-line__remove"
                  onClick={() => onRemove(line.lineId)}
                  aria-label={`${line.menuName} 삭제`}
                >
                  ✕
                </button>
              </div>

              {line.optionSummary && <p className="cart-line__options">{line.optionSummary}</p>}

              <div className="cart-line__foot">
                <div className="quantity__control quantity__control--small">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onChangeQuantity(line.lineId, line.quantity - 1)}
                    disabled={line.quantity <= MIN_QUANTITY}
                    aria-label="수량 줄이기"
                  >
                    −
                  </button>
                  <span className="quantity__value">{line.quantity}</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onChangeQuantity(line.lineId, line.quantity + 1)}
                    disabled={line.quantity >= MAX_QUANTITY}
                    aria-label="수량 늘리기"
                  >
                    ＋
                  </button>
                </div>
                <span className="cart-line__price">{formatPrice(line.previewUnitPrice * line.quantity)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="cart__total">
        <span>총 {totalCount}개</span>
        <strong>{formatPrice(totalPrice)}</strong>
      </div>

      <button
        type="button"
        className="button button--primary button--block"
        onClick={onSubmit}
        disabled={lines.length === 0 || submitting}
      >
        {submitting ? '주문하는 중…' : '주문하기'}
      </button>
    </aside>
  );
}
