import { useCallback, useEffect, useState } from 'react';
import { ApiError, createOrder, fetchMenu } from './api';
import Cart from './components/Cart';
import MenuList from './components/MenuList';
import OptionPanel from './components/OptionPanel';
import OrderComplete from './components/OrderComplete';
import type { CartLine, Menu, Order, OrderRequestItem } from './types';
import { clampQuantity } from './utils';

type Screen = 'menu' | 'complete';

export default function App() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const [screen, setScreen] = useState<Screen>('menu');
  const [order, setOrder] = useState<Order | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      setMenus(await fetchMenu());
    } catch (error) {
      // 백엔드가 꺼져 있어도 흰 화면으로 죽지 않고 이유를 보여 준다.
      setMenuError(error instanceof Error ? error.message : '메뉴를 불러오지 못했습니다.');
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  function addToCart(line: CartLine) {
    // 옵션이 같더라도 줄을 합치지 않는다. 같은 메뉴를 옵션만 다르게 여러 번 담을 수 있어야 하고,
    // 합치는 규칙을 넣는 순간 "아메리카노 ICE 와 HOT 이 한 줄로 보이는" 버그가 생긴다.
    setCart((prev) => [...prev, line]);
    setSelectedMenu(null);
    setOrderError(null);
  }

  function changeQuantity(lineId: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) => (line.lineId === lineId ? { ...line, quantity: clampQuantity(quantity) } : line)),
    );
  }

  function removeLine(lineId: string) {
    setCart((prev) => prev.filter((line) => line.lineId !== lineId));
  }

  async function submitOrder() {
    if (cart.length === 0 || submitting) return;

    // 화면 전용 필드(lineId / menuName / optionSummary / previewUnitPrice)를 여기서 걷어낸다.
    // 서버로 나가는 것은 menuId / quantity / options 뿐 — 금액은 절대 보내지 않는다.
    const items: OrderRequestItem[] = cart.map(({ menuId, quantity, options }) => ({
      menuId,
      quantity,
      options,
    }));

    setSubmitting(true);
    setOrderError(null);
    try {
      const created = await createOrder(items);
      setOrder(created);
      setScreen('complete');
      setCart([]);
    } catch (error) {
      // 실패하면 장바구니를 그대로 둔다. 고친 뒤 다시 누르면 되도록.
      const message = error instanceof ApiError ? `${error.message} (${error.code})` : '주문에 실패했습니다.';
      setOrderError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function startNewOrder() {
    setOrder(null);
    setOrderError(null);
    setScreen('menu');
  }

  if (screen === 'complete' && order) {
    return (
      <div className="app">
        <Header />
        <main className="app__main app__main--single">
          <OrderComplete order={order} onNewOrder={startNewOrder} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <section className="app__menu">
          {menuLoading && <p className="status status--loading">메뉴를 불러오는 중…</p>}

          {menuError && (
            <div className="status status--error" role="alert">
              <p className="status__message">{menuError}</p>
              <button type="button" className="button" onClick={() => void loadMenu()}>
                다시 시도
              </button>
            </div>
          )}

          {!menuLoading && !menuError && <MenuList menus={menus} onSelect={setSelectedMenu} />}
        </section>

        <section className="app__cart">
          {orderError && (
            <div className="status status--error" role="alert">
              <p className="status__message">{orderError}</p>
            </div>
          )}

          <Cart
            lines={cart}
            submitting={submitting}
            onChangeQuantity={changeQuantity}
            onRemove={removeLine}
            onSubmit={() => void submitOrder()}
          />
        </section>
      </main>

      {selectedMenu && (
        <OptionPanel menu={selectedMenu} onAdd={addToCart} onClose={() => setSelectedMenu(null)} />
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="app__header">
      <h1 className="app__logo">☕ 16온즈 커피</h1>
      <p className="app__tagline">메뉴를 고르고 옵션을 선택해 주문해 보세요.</p>
    </header>
  );
}
