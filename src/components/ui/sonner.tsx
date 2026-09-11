import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()
  return <Sonner theme={theme as ToasterProps["theme"]} richColors position="top-right" {...props} />
}

export { Toaster }
