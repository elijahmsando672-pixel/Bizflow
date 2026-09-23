import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
}: {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const resolvedValue = value !== undefined ? value : internalValue
  const resolvedOnChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: resolvedValue, onValueChange: resolvedOnChange }}>
      {children}
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({
  className,
  value,
  children,
}: {
  className?: string
  value: string
  children: React.ReactNode
}) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isActive = selectedValue === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-foreground shadow-sm dark:bg-card"
          : "hover:bg-muted/80 hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({
  className,
  value,
  children,
}: {
  className?: string
  value: string
  children: React.ReactNode
}) {
  const { value: selectedValue } = React.useContext(TabsContext)
  if (selectedValue !== value) return null

  return (
    <div className={cn("mt-4 focus-visible:outline-none", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
