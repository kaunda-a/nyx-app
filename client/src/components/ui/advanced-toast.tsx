import { Toast, ToastProps } from "./toast"
import { cn } from "@/lib/utils"
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react"

interface AdvancedToastProps extends ToastProps {
  variant?: "success" | "error" | "info" | "warning"
}

const variants = {
  success: {
    icon: IconCheck,
    className: "border-green-500/20 bg-green-500/10",
  },
  error: {
    icon: IconX,
    className: "border-red-500/20 bg-red-500/10",
  },
  info: {
    icon: IconInfoCircle,
    className: "border-blue-500/20 bg-blue-500/10",
  },
  warning: {
    icon: IconAlertTriangle,
    className: "border-yellow-500/20 bg-yellow-500/10",
  },
}

export function AdvancedToast({
  className,
  variant = "info",
  ...props
}: AdvancedToastProps) {
  const Icon = variants[variant].icon

  return (
    <Toast
      className={cn(
        "border backdrop-blur-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[swipe=end]:animate-out data-[swipe=end]:fade-out-0 data-[swipe=end]:zoom-out-95",
        variants[variant].className,
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {props.children}
      </div>
    </Toast>
  )
}