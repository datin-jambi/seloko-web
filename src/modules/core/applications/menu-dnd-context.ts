import { createContext, useContext } from 'react'
import type { DropPosition } from './menu-tree'

/**
 * Status drag yang dibagikan ke setiap baris: baris mana yang diseret, baris
 * mana yang jadi sasaran, dan di sisi mana ia akan disisipkan.
 *
 * Dipisah dari `MenuTreeDnd.tsx` karena file komponen hanya boleh mengekspor
 * komponen agar Fast Refresh tetap bekerja (aturan lint `only-export-components`).
 */
export type MenuDndState = {
  activeId: string | null
  overId: string | null
  position: DropPosition
  /** Sasaran berada di tingkat berbeda → jatuh tidak akan diterima. */
  rejected: boolean
}

export const NO_DRAG: MenuDndState = { activeId: null, overId: null, position: 'after', rejected: false }

export const MenuDndContext = createContext<MenuDndState>(NO_DRAG)

/** Dipakai `SortableRow` untuk menggambar penanda sisip di baris sasaran. */
export const useMenuDnd = () => useContext(MenuDndContext)
