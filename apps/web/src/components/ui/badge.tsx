import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-badge px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-primary-100 text-primary-800",
      accent: "bg-accent-100 text-accent-600",
      success: "bg-success-light text-success",
      error: "bg-error-light text-error",
      warning: "bg-warning-light text-warning",
      outline: "border border-primary-300 text-primary-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props}>{children}</span>;
}

