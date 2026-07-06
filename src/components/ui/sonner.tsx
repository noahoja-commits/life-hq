import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#0a0a0a",
          "--normal-text": "#d4d0c8",
          "--normal-border": "#c41e3a",
          "--success-bg": "#0a0a0a",
          "--success-text": "#d4d0c8",
          "--success-border": "#c41e3a",
          "--error-bg": "#0a0a0a",
          "--error-text": "#d4d0c8",
          "--error-border": "#dc2626",
          "--info-bg": "#0a0a0a",
          "--info-text": "#d4d0c8",
          "--info-border": "#c41e3a",
          "--warning-bg": "#0a0a0a",
          "--warning-text": "#d4d0c8",
          "--warning-border": "#c4943a",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
