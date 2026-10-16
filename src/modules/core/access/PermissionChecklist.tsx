export type PermissionGroup = {
  module: string
  permissions: { id: string; code: string; name: string }[]
}

/**
 * Daftar centang permission dikelompokkan per modul. Satu save = satu kiriman
 * seluruh daftar (API `PUT /roles/:id/permissions` menyetel ulang, bukan menambah).
 * Checkbox native + `accent-primary`, sama seperti form lain di aplikasi ini.
 */
export function PermissionChecklist({
  groups,
  selected,
  onToggle,
  disabled,
}: {
  groups: PermissionGroup[]
  selected: Set<string>
  onToggle: (id: string, checked: boolean) => void
  disabled?: boolean
}) {
  if (groups.length === 0)
    return <p className="text-xs text-muted-foreground">Aplikasi ini belum punya permission.</p>

  return (
    <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border border-border p-3">
      {groups.map((g) => (
        <fieldset key={g.module} disabled={disabled} className="min-w-0">
          <legend className="mb-2 text-xs font-semibold text-foreground">
            {g.module}
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
              {g.permissions.filter((p) => selected.has(p.id)).length}/{g.permissions.length}
            </span>
          </legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {g.permissions.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  disabled={disabled}
                  onChange={(e) => onToggle(p.id, e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{p.name}</span>
                  <span className="block truncate font-mono text-muted-foreground">{p.code}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
