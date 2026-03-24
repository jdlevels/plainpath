import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-6 w-6 shrink-0 appearance-none rounded-md border-2 border-border bg-background ring-offset-background transition-all checked:bg-primary checked:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <Check className="pointer-events-none absolute h-4 w-4 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
