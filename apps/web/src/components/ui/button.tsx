import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-luxury active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary-900 text-white shadow-card hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card-hover",
        secondary: "border border-primary-900 text-primary-900 hover:bg-primary-900 hover:text-white",
        ghost: "text-primary-700 hover:bg-primary-100",
        accent: "bg-accent-400 text-primary-950 hover:bg-accent-300",
        destructive: "bg-error text-white hover:bg-red-700",
        link: "p-0 text-primary-900 underline-offset-4 hover:underline",
      },
      size: {
        sm: "gap-1.5 rounded-button px-3 py-2 text-sm",
        md: "gap-2 rounded-button px-6 py-3 text-base",
        lg: "gap-2.5 rounded-button px-8 py-4 text-lg",
        icon: "rounded-full p-2",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, fullWidth, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, fullWidth, className }))} disabled={disabled || loading} {...props}>
      {loading && <Spinner size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

export { buttonVariants };

