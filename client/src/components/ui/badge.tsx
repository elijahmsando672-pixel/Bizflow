import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
        secondary:
          "bg-secondary/10 text-secondary ring-1 ring-inset ring-secondary/20",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
        warning:
          "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
        outline:
          "text-foreground ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
