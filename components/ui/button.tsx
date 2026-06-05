import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duma-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:brightness-105",
        ghost: "text-gray-600 hover:bg-white/60 hover:text-duma-primary backdrop-blur-sm",
        outline:
          "border border-white/70 bg-white/50 text-gray-700 backdrop-blur-md hover:bg-white/80 hover:text-duma-primary hover:border-duma-primary/30 shadow-glass-sm",
        secondary:
          "border border-white/60 bg-white/60 text-gray-900 backdrop-blur-md hover:bg-white/80 shadow-glass-sm",
        destructive:
          "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-glow hover:brightness-105",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-sm",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
