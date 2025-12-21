import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Vision UI: Glass background with subtle border
        "glass-vision border border-primary/10 hover:border-primary/25 transition-all duration-300",
        // Vision UI: Neon focus state
        "focus-visible:neon-border focus-visible:shadow-[0_0_20px_oklch(0.72_0.24_210_/_25%)]",
        // Error state
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_15px_oklch(0.65_0.25_25_/_25%)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
