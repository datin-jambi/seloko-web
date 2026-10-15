import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AppMark } from '@/modules/core/users/AppMark'
import { USER_DETAIL } from '@/modules/core/users/user-form'

type AppRef = { id: string; code: string; name: string }

/**
 * Sel "Aplikasi": tumpukan penanda + jumlah. Tooltip memuat daftar lengkapnya.
 * Dipakai di daftar pengguna dan daftar pengguna per aplikasi. `linkToUser` menautkan
 * baris tooltip ke detail pengguna (tidak dipakai di halaman detail pengguna itu sendiri).
 */
export function AppCount({ apps, linkToUser }: { apps: AppRef[]; linkToUser?: string }) {
  if (apps.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${apps.length} aplikasi: ${apps.map((a) => a.name).join(', ')}`}
          className="group/apps -mx-1 inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {/* Tumpukan: tiap tanda diberi cincin warna latar agar tepi tumpang-tindih terbaca. */}
          <span className="flex -space-x-1">
            {apps.slice(0, 3).map((a) => (
              <span
                key={a.id}
                className="rounded-md bg-card ring-2 ring-card group-hover/apps:bg-muted group-hover/apps:ring-muted"
              >
                <AppMark code={a.code} size="sm" />
              </span>
            ))}
          </span>
          <span className="text-sm tabular-nums">
            {apps.length}
            <span className="text-muted-foreground"> aplikasi</span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-64 max-w-none p-0">
        <p className="border-b border-border px-3 py-2 text-xs font-semibold">Akses aplikasi</p>
        <ul className="p-1.5">
          {apps.map((a) => {
            const body = (
              <>
                <AppMark code={a.code} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{a.code}</span>
                </span>
              </>
            )
            return (
              <li key={a.id}>
                {linkToUser ? (
                  <Link
                    to={USER_DETAIL(linkToUser)}
                    className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {body}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">{body}</span>
                )}
              </li>
            )
          })}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
