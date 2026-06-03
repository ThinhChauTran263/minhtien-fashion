"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const interactive = Boolean(onChange) && !readonly;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            aria-label={`${star} sao`}
            className={cn(
              sizeMap[size],
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                "w-full h-full transition-colors",
                filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

