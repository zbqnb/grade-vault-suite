import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "glass-card gradient-primary text-primary-foreground hover-glow shadow-elegant",
        destructive: "glass-card bg-destructive text-destructive-foreground hover:bg-destructive/90 hover-lift",
        outline: "glass-subtle border-2 border-primary/20 hover:border-primary/40 hover-glow text-foreground",
        secondary: "glass-card bg-muted/50 text-foreground hover:bg-muted/70 hover-lift",
        ghost: "transition-smooth hover:bg-muted/30 text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline transition-smooth",
        premium: "glass-card gradient-accent text-accent-foreground hover-glow shadow-elegant animate-pulse-glow",
        glass: "glass backdrop-blur-xl text-foreground hover-glow border border-primary/20",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base font-bold",
        icon: "h-11 w-11 rounded-xl",
        xs: "h-7 rounded-md px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
