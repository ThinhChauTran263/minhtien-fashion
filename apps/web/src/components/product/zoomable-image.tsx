"use client";

import { useState, MouseEvent, memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export const ZoomableImage = memo(function ZoomableImage({ src, alt, priority = false }: ZoomableImageProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    
    // TÃ­nh toÃ¡n pháº§n trÄƒm tá»a Ä‘á»™ chuá»™t so vá»›i khung chá»©a
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    // TÃ¹y chá»n: ÄÆ°a vá»‹ trÃ­ vá» trung tÃ¢m khi Ä‘Æ°a chuá»™t ra ngoÃ i
    setTimeout(() => setPosition({ x: 50, y: 50 }), 300);
  };

  return (
    <div 
      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-primary-50 cursor-crosshair"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={cn(
          "object-cover transition-transform duration-300 ease-out",
          isHovered ? "scale-[2.2]" : "scale-100"
        )}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`
        }}
      />
    </div>
  );
});

