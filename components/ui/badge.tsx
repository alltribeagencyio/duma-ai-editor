import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-duma-primary/10 text-duma-primary",
        secondary: "bg-gray-100 text-gray-700",
        pending: "bg-gray-100 text-gray-700",
        processing: "bg-duma-secondary/10 text-duma-secondary",
        completed: "bg-green-50 text-green-700",
        failed: "bg-red-50 text-red-700",
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
