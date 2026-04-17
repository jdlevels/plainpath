import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react"
import { useThemeContext } from "@/components/ThemeProvider"
import type { Theme } from "@/hooks/useTheme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: "light",  label: "Light",  Icon: Sun },
  { value: "dark",   label: "Dark",   Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext()

  const CurrentIcon =
    theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          aria-label="Toggle theme"
        >
          <CurrentIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={`gap-2 cursor-pointer ${theme === value ? "font-semibold text-primary" : ""}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
