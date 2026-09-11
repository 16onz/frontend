import type { Order } from '../types';
import { formatDateTime, formatPrice } from '../utils';

interface Props {
  order: Order;
  onNewOrder: () => void;
}

/**
 * 주문 완료 화면.
 *
 * 여기서 보여 주는 값은 **전부 서버 응답 그대로**다. id → 이름 매핑도, 금액 계산도 다시 하지 않는다.
 * 응답에 표시용 이름(menuName, groupName, choiceName)이 모두 들어 있기 때문이다. (API.md 설계 규칙 3)
 */
export default function OrderComplete({ order, onNewOrder }: Props) {
  return (
    <div className="complete">
      <div className="complete__hero">
        <span className="complete__emoji" aria-hidden="true">
          ☕
        </span>
        <h1 className="complete__title">주문되었습니다!</h1>
        <p className="complete__subtitle">주문번호를 확인해 주세요.</p>

        <div className="complete__order-no">
          <span className="complete__order-no-label">주문번호</span>
          <strong className="complete__order-no-value">{order.orderNo}</strong>
        </div>

        <p className="complete__time">{formatDateTime(order.orderedAt)}</p>
      </div>

      <section className="complete__receipt">
        <h2 className="complete__receipt-title">주문 내역</h2>

        <ul className="receipt-list">
          {order.items.map((item, index) => (
            <li key={`${item.menuId}-${index}`} className="receipt-line">
              <div className="receipt-line__head">
                <span className="receipt-line__name">{item.menuName}</span>
                <span className="receipt-line__qty">× {item.quantity}</span>
                <span className="receipt-line__price">{formatPrice(item.lineTotal)}</span>
              </div>

              {item.options.length > 0 && (
                <p className="receipt-line__options">{item.options.map((o) => o.choiceName).join(' / ')}</p>
              )}

              <p className="receipt-line__unit">1개당 {formatPrice(item.unitPrice)}</p>
            </li>
          ))}
        </ul>

        <div className="receipt-total">
          <span>총 {order.totalCount}개</span>
          <strong>{formatPrice(order.totalPrice)}</strong>
        </div>
      </section>

      <button type="button" className="button button--primary button--block" onClick={onNewOrder}>
        새 주문하기
      </button>
    </div>
  );
}
