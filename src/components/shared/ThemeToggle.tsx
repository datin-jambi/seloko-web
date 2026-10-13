import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  // Kelas awal dipasang skrip inline di index.html.
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const label = isDark ? 'Mode terang' : 'Mode gelap'

  const toggle = () => {
    document.documentElement.classList.toggle('dark', !isDark)
    localStorage.setItem('theme', isDark ? 'light' : 'dark')
    setIsDark(!isDark)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
