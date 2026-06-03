import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, icon, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-primary-800">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">{icon}</div>}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-input border bg-white px-4 py-3 text-body-md transition-all duration-150 placeholder:text-primary-400 focus:border-transparent focus:outline-none focus:ring-2",
            icon && "pl-10",
            error ? "border-error focus:ring-error" : "border-primary-200 focus:ring-primary-900",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {helper && !error && <p className="text-xs text-primary-500">{helper}</p>}
    </div>
  );
});

