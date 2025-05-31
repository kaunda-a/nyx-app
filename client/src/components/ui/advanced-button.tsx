import { cn } from "@/lib/utils"
import { ButtonProps, Button } from "./button"
import { useState, useEffect } from "react"

interface AdvancedButtonProps extends ButtonProps {
  variant?: "shine" | "glow" | "gradient" | "outline"
  loading?: boolean
}

export function AdvancedButton({
  children,
  className,
  variant = "shine",
  loading,
  ...props
}: AdvancedButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHovering) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const variants = {
    shine: "overflow-hidden relative after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent hover:after:translate-x-[100%] after:transition-transform after:duration-500",
    glow: "relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/0 before:to-accent/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
    gradient: "bg-gradient-to-r from-primary to-accent hover:bg-[length:200%_200%] transition-all duration-500",
    outline: "border border-primary/20 bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-colors"
  }

  return (
    <Button
      className={cn(
        variants[variant],
        "relative transition-all duration-300",
        loading && "animate-pulse",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
      {variant === "glow" && isHovering && (
        <div
          className="absolute inset-0 bg-primary/10 blur-lg transition-opacity"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </Button>
  )
}