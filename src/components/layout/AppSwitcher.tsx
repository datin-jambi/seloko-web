import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/app-store'
import { APP_CODES, APP_CONFIGS } from '@/config/constants'
import {
  Shield,
  Building2,
  Store,
  ChevronDown,
  Check,
  LayoutGrid,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

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

  const currentConfig = APP_CONFIGS[activeAppCode] || {
    name: 'Aplikasi Terpilih',
    description: 'Sistem Pemerintahan Jambi',
    icon: 'layout-grid',
    badgeColor: 'bg-zinc-500/10 text-zinc-500',
  }

  const CurrentIcon = APP_ICONS[currentConfig.icon] || LayoutGrid

  const handleSelectApp = (code: string) => {
    if (code === activeAppCode) return
    setActiveAppCode(code)
    // Invalidate query menu & cache aplikasi
    queryClient.invalidateQueries({ queryKey: ['menus'] })
    queryClient.invalidateQueries({ queryKey: ['me'] })

    // Redirect ke root dashboard aplikasi tersebut
    if (code === APP_CODES.BAPENDA_PROFILE) {
      navigate('/bapenda')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full max-w-[260px] justify-between border-border/80 bg-background/60 px-3 hover:bg-accent/70"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CurrentIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-semibold leading-tight text-foreground truncate">
                {currentConfig.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {activeAppCode}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px] p-2">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>GANTI EKOSISTEM APLIKASI</span>
          <Badge variant="outline" className="text-[10px] py-0">
            Multi-Tenancy
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-1 py-1">
          {Object.entries(APP_CONFIGS).map(([code, config]) => {
            const IconComp = APP_ICONS[config.icon] || LayoutGrid
            const isSelected = activeAppCode === code

            return (
              <DropdownMenuItem
                key={code}
                onClick={() => handleSelectApp(code)}
                className={`flex items-start gap-3 rounded-lg p-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {config.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                    {config.description}
                  </p>
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
