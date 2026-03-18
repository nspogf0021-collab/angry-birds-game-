import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 btn-3d tracking-wider text-stroke text-white",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary/90 text-primary-foreground border-b-4 border-red-800",
        destructive: "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-b-4 border-red-900",
        outline: "border-4 border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground border-b-4 text-stroke-0 text-slate-800",
        secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-b-4 border-yellow-700",
        accent: "bg-accent hover:bg-accent/90 text-accent-foreground border-b-4 border-green-800",
        ghost: "hover:bg-accent hover:text-accent-foreground btn-none shadow-none text-stroke-0 text-slate-800",
        link: "text-primary underline-offset-4 hover:underline btn-none shadow-none text-stroke-0",
      },
      size: {
        default: "h-12 px-6 py-2 text-lg",
        sm: "h-10 rounded-xl px-4 text-base",
        lg: "h-16 rounded-3xl px-10 text-2xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
