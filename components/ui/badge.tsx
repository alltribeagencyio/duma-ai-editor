import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-duma-primary/10 text-duma-primary ring-1 ring-inset ring-duma-primary/20",
        secondary: "bg-white/60 text-gray-700 ring-1 ring-inset ring-white/70",
        pending: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20",
        processing: "bg-duma-secondary/10 text-duma-secondary ring-1 ring-inset ring-duma-secondary/20",
        completed: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20",
        failed: "bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20",
        outline: "border border-duma-primary/30 text-duma-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
