"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 phÃºt
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        gap={8}
        offset={16}
        toastOptions={{
          duration: 3000,
          unstyled: false,
          classNames: {
            toast:
              "group !rounded-xl !border !border-primary-100/60 !bg-white !shadow-[0_4px_20px_rgb(0,0,0,0.06)] !py-3 !px-4 !gap-2.5 !font-sans !items-center",
            title: "!text-[13px] !font-semibold !text-primary-900 !leading-tight",
            description: "!text-[12px] !text-primary-500 !leading-snug !mt-0.5",
            actionButton:
              "!bg-transparent !border !border-primary-200 !text-primary-800 hover:!bg-primary-50 hover:!border-primary-300 !rounded-lg !px-3 !py-1.5 !text-[12px] !font-medium !transition-all !duration-150 !cursor-pointer !ml-auto !shrink-0",
            cancelButton:
              "!bg-transparent !text-primary-400 hover:!text-primary-600 !rounded-lg !px-2 !py-1 !text-[12px] !font-medium !transition-colors !duration-150 !cursor-pointer",
            success: "!border-emerald-100/80",
            error: "!border-red-100/80",
            icon: "!w-4 !h-4 !mr-0",
          },
        }}
      />
    </QueryClientProvider>
  );
}

