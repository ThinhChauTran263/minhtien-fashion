import Image from "next/image";
import { cn } from "@/lib/utils";

export function Card({ children, className, hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-primary-100 bg-surface shadow-card", hover && "transition-all duration-300 ease-luxury hover:-translate-y-1 hover:shadow-card-hover", className)}>
      {children}
    </div>
  );
}

export function CardImage({ src, alt, aspectRatio = "square" }: { src: string; alt: string; aspectRatio?: "square" | "portrait" | "landscape" }) {
  const ratios = { square: "aspect-square", portrait: "aspect-[3/4]", landscape: "aspect-[4/3]" };
  return (
    <div className={cn("relative overflow-hidden bg-primary-100", ratios[aspectRatio])}>
      <Image src={src} alt={alt} fill className="object-cover transition-transform duration-700 ease-luxury hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-card-p-sm md:p-card-p", className)}>{children}</div>;
}

