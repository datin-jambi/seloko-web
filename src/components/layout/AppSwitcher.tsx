import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/app-store'
import { APP_CONFIGS, appHome } from '@/config/constants'
import { Shield, Building2, Store, ChevronsUpDown, Check, LayoutGrid } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const APP_ICONS: Record<string, React.ElementType> = {
  shield: Shield,
  'building-2': Building2,
  store: Store,
  'layout-grid': LayoutGrid,
}

export function AppSwitcher() {
  const { activeAppCode, setActiveAppCode } = useAppStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const current = APP_CONFIGS[activeAppCode]
  const CurrentIcon = APP_ICONS[current?.icon] || LayoutGrid

  const handleSelectApp = (code: string) => {
    if (code === activeAppCode) return
    setActiveAppCode(code)
    queryClient.invalidateQueries({ queryKey: ['menus'] })
    queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate(appHome(code))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 min-w-0 max-w-[280px] items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-accent"
        >
          <CurrentIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-semibold text-foreground">
            {current?.name ?? activeAppCode}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Pindah aplikasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(APP_CONFIGS).map(([code, config]) => {
          const Icon = APP_ICONS[config.icon] || LayoutGrid
          const isSelected = activeAppCode === code
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleSelectApp(code)}
              className="items-start gap-3 py-2"
            >
              <Icon className={cn('mt-0.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{config.name}</div>
                <div className="text-xs leading-snug text-muted-foreground">
                  {config.description}
                </div>
              </div>
              {isSelected && <Check className="mt-0.5 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
