import { useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parentOf, type DropPosition, type Node, type Tree } from './menu-tree'
import { MenuDndContext, NO_DRAG, useMenuDnd, type MenuDndState } from './menu-dnd-context'

/** Node menu selalu punya `label`; dipakai untuk pratinjau saat menyeret. */
export type LabeledNode = Node & { label: string }

/**
 * Papan drag & drop untuk urutan menu.
 *
 * Yang diubah HANYA urutan di antara saudara sekandung. Hierarki sengaja tidak
 * ikut berubah lewat drag: satu gerakan yang meleset beberapa piksel bisa
 * memindahkan menu ke induk lain tanpa disadari (dan sudah pernah terjadi saat
 * uji awal). Perubahan induk punya jalurnya sendiri di form "Ubah".
 *
 * Umpan balik visual saat menyeret (supaya jelas akan jatuh DI MANA):
 * - garis sisip tebal di tepi atas/bawah baris sasaran + titik di ujungnya,
 * - latar baris sasaran ikut menyala,
 * - pratinjau kecil menempel di kursor,
 * - bila sasaran beda tingkat: garis & latar jadi merah (tidak boleh),
 * - pembaca layar menerima pengumuman lewat `aria-live`.
 */
export type MenuDndProps = {
  tree: Tree<LabeledNode>[]
  enabled: boolean
  /** `position` selalu `before`/`after` (lihat catatan di atas). */
  onReorder: (activeId: string, overId: string, position: DropPosition) => void
  /** Dipanggil bila pengguna menyeret antar-tingkat; UI memberi penjelasan. */
  onRejected: (activeId: string, overId: string) => void
  children: ReactNode
}

const rowId = (id: string) => `menu-${id}`

/** `before` bila titik tengah baris yang diseret ada di paruh atas sasaran. */
function positionFrom(active: DragOverEvent['active'] | DragEndEvent['active'], overRect: { top: number; height: number }): DropPosition {
  const activeRect = active.rect.current.translated
  if (!activeRect) return 'after'
  const pointerY = activeRect.top + activeRect.height / 2
  return pointerY < overRect.top + overRect.height / 2 ? 'before' : 'after'
}

export function MenuTreeDnd({ tree, enabled, onReorder, onRejected, children }: MenuDndProps) {
  const [state, setState] = useState<MenuDndState>(NO_DRAG)

  const sensors = useSensors(
    // Jarak 6px: klik tombol aksi di dalam baris tidak boleh memicu drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Keyboard: Tab ke pegangan → Space angkat → panah pindah → Space jatuh.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeNode = useMemo(
    () => (state.activeId ? (findNode(tree, state.activeId) ?? null) : null),
    [tree, state.activeId],
  )

  const start = (e: DragStartEvent) => {
    const activeId = String(e.active.id).replace(/^menu-/, '')
    setState({ activeId, overId: null, position: 'after', rejected: false })
  }

  const over = (e: DragOverEvent) => {
    const overId = e.over?.id
    if (!overId || typeof overId !== 'string') {
      setState((s) => ({ ...s, overId: null, rejected: false }))
      return
    }
    const activeId = String(e.active.id).replace(/^menu-/, '')
    const target = overId.replace(/^menu-/, '')
    const position = positionFrom(e.active, e.over!.rect)
    const rejected = target !== activeId && parentOf(tree, activeId) !== parentOf(tree, target)
    setState({ activeId, overId: target === activeId ? null : target, position, rejected })
  }

  const end = (e: DragEndEvent) => {
    const overId = e.over?.id
    const activeId = String(e.active.id).replace(/^menu-/, '')
    const target = typeof overId === 'string' ? overId.replace(/^menu-/, '') : null
    const rejected = target ? parentOf(tree, activeId) !== parentOf(tree, target) : false
    const position = target && e.over ? positionFrom(e.active, e.over.rect) : 'after'

    setState(NO_DRAG)
    if (!target || target === activeId) return
    if (rejected) {
      onRejected(activeId, target)
      return
    }
    onReorder(activeId, target, position)
  }

  if (!enabled) return <>{children}</>

  // Nama menu, bukan id — pengumuman yang menyebut UUID tidak berguna.
  const labelOf = (id: string | null) => (id ? (findNode(tree, id)?.label ?? 'menu ini') : '')
  const announce = !state.activeId
    ? ''
    : state.rejected
      ? `Tidak bisa dipindah: ${labelOf(state.activeId)} dan ${labelOf(state.overId)} berbeda tingkat.`
      : state.overId
        ? `Akan diletakkan ${state.position === 'before' ? 'sebelum' : 'sesudah'} ${labelOf(state.overId)}.`
        : `Menyeret ${labelOf(state.activeId)}.`

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={start}
      onDragOver={over}
      onDragEnd={end}
      onDragCancel={() => setState(NO_DRAG)}
    >
      <MenuDndContext.Provider value={state}>
        <SortableContext items={tree.map((n) => rowId(n.id))} strategy={rectSortingStrategy}>
          {children}
        </SortableContext>

        {/* Pratinjau mengikuti kursor: pengguna melihat "yang dibawa" tetap utuh,
            sementara baris aslinya diredupkan. `shadow-lg` di sini sah — ini
            elemen mengambang, bukan permukaan statis. */}
        <DragOverlay dropAnimation={null}>
          {activeNode ? (
            <div
              className={cn(
                'pointer-events-none flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-lg ring-2',
                state.rejected ? 'border-destructive/50 ring-destructive/20' : 'border-primary/50 ring-primary/20',
              )}
            >
              <GripVertical aria-hidden className="size-4 text-muted-foreground" />
              <span className="truncate">{activeNode.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </MenuDndContext.Provider>

      {/* Pengumuman untuk pembaca layar. */}
      <p aria-live="assertive" className="sr-only">
        {announce}
      </p>
    </DndContext>
  )
}

/** Cari node berdasarkan id (pratinjau overlay + pengumuman pembaca layar). */
function findNode(nodes: Tree<LabeledNode>[], id: string): Tree<LabeledNode> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const hit = findNode(node.items, id)
    if (hit) return hit
  }
  return undefined
}

/** Pembungkus satu baris agar bisa diseret, plus penanda sisip saat jadi sasaran. */
export function SortableRow({
  node,
  disabled,
  children,
}: {
  node: Tree<LabeledNode>
  disabled?: boolean
  children: (handle: { attributes: DraggableAttributes; listeners: SyntheticListenerMap | undefined }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId(node.id),
    disabled,
    data: { nodeId: node.id },
  })
  const { activeId, overId, position, rejected } = useMenuDnd()

  const isTarget = !!activeId && overId === node.id
  const before = position === 'before'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative rounded-md transition-colors',
        isDragging && 'z-10 opacity-40',
        // Baris sasaran ikut menyala supaya arah sisip terbaca walau barisnya tinggi.
        isTarget && (rejected ? 'bg-destructive/10 ring-2 ring-destructive/40' : 'bg-primary/10 ring-2 ring-primary/40'),
      )}
    >
      {children({ attributes, listeners })}

      {isTarget && (
        <>
          {/* Garis sisip: 3px + bayangan tipis supaya terlihat "menempel", bukan
              sekadar border baris. Diletakkan menimpa tepi baris sasaran. */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-x-0 z-20 h-[3px] rounded-full shadow-sm',
              rejected ? 'bg-destructive' : 'bg-primary',
              before ? '-top-1.5' : '-bottom-1.5',
            )}
          />
          {/* Titik di ujung kiri = ujung tempat item akan menempel. */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-0 z-20 size-2.5 -translate-x-1/2 rounded-full border-2 border-card',
              rejected ? 'bg-destructive' : 'bg-primary',
              before ? '-top-1.5' : '-bottom-1.5',
            )}
          />
          {/* Label posisi: menghapus semua keraguan "masuk ke mana". */}
          <span
            className={cn(
              'pointer-events-none absolute right-2 z-20 rounded px-1.5 py-0.5 text-xs font-semibold',
              rejected
                ? 'bg-destructive/15 text-destructive'
                : 'bg-primary/15 text-primary',
              before ? '-top-2.5' : '-bottom-2.5',
            )}
          >
            {rejected ? 'beda tingkat' : before ? 'di sini ↑' : 'di sini ↓'}
          </span>
        </>
      )}
    </div>
  )
}
