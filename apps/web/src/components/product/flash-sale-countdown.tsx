"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  endsAt: string;
  onExpire?: () => void;
  className?: string;
}

function calcRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
    expired: false,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function FlashSaleCountdown({ endsAt, onExpire, className }: CountdownProps) {
  const [time, setTime] = useState(() => calcRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = calcRemaining(endsAt);
      setTime(next);
      if (next.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (time.expired) {
    return <span className={className}>ÄÃ£ káº¿t thÃºc</span>;
  }

  return (
    <div className={`inline-flex items-center gap-1 font-mono ${className || ""}`}>
      <span className="bg-primary-900 text-white px-2 py-1 rounded text-sm font-bold">
        {pad(time.h)}
      </span>
      <span className="text-primary-900 font-bold">:</span>
      <span className="bg-primary-900 text-white px-2 py-1 rounded text-sm font-bold">
        {pad(time.m)}
      </span>
      <span className="text-primary-900 font-bold">:</span>
      <span className="bg-primary-900 text-white px-2 py-1 rounded text-sm font-bold">
        {pad(time.s)}
      </span>
    </div>
  );
}

