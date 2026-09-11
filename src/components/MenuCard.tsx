import type { Menu } from '../types';
import { formatPrice } from '../utils';

interface Props {
  menu: Menu;
  onSelect: (menu: Menu) => void;
}

/** 메뉴 한 장. 클릭하면 옵션 패널이 열린다. */
export default function MenuCard({ menu, onSelect }: Props) {
  const optionCount = menu.optionGroups.length;

  return (
    <button type="button" className="menu-card" onClick={() => onSelect(menu)}>
      <div className="menu-card__head">
        <h3 className="menu-card__name">{menu.name}</h3>
        <span className="menu-card__price">{formatPrice(menu.basePrice)}</span>
      </div>
      <p className="menu-card__desc">{menu.description}</p>
      <span className="menu-card__hint">
        {optionCount > 0 ? `옵션 ${optionCount}가지 선택` : '옵션 없음'}
      </span>
    </button>
  );
}
