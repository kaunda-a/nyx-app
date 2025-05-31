import { cn } from "@/lib/utils"
import { InputProps } from "./input"
import { forwardRef, useState } from "react"

interface FloatingInputProps extends InputProps {
  label: string
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "peer h-14 w-full rounded-md border bg-transparent px-4 pt-4 pb-1.5 text-foreground placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
            className
          )}
          placeholder={label}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            setHasValue(e.target.value.length > 0)
          }}
          {...props}
        />
        <label
          className={cn(
            "absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-muted-foreground duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 peer-focus:text-primary",
            (isFocused || hasValue) && "text-primary"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingInput.displayName = "FloatingInput"