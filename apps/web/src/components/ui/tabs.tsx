"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const TabsRoot = Tabs.Root;

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Tabs.List className={cn("mb-6 flex gap-1 border-b border-primary-200", className)}>{children}</Tabs.List>;
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn("border-b-2 border-transparent px-4 py-2 text-sm font-medium text-primary-600 transition-colors data-[state=active]:border-primary-900 data-[state=active]:text-primary-900", className)}
    >
      {children}
    </Tabs.Trigger>
  );
}

export const TabsContent = Tabs.Content;

