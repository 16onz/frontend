import type { Menu } from '../types';
import MenuCard from './MenuCard';

interface Props {
  menus: Menu[];
  onSelect: (menu: Menu) => void;
}

/**
 * 카테고리별로 묶어서 렌더한다.
 * 카테고리 목록을 하드코딩하지 않고 응답에서 뽑아내므로,
 * 백엔드가 메뉴를 추가하면 이 파일을 고치지 않아도 화면에 나타난다.
 */
export default function MenuList({ menus, onSelect }: Props) {
  const categories = [...new Set(menus.map((menu) => menu.category))];

  return (
    <div className="menu-list">
      {categories.map((category) => (
        <section key={category} className="menu-section">
          <h2 className="menu-section__title">{category}</h2>
          <div className="menu-grid">
            {menus
              .filter((menu) => menu.category === category)
              .map((menu) => (
                <MenuCard key={menu.id} menu={menu} onSelect={onSelect} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
