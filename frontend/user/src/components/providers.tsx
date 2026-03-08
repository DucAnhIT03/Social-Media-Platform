"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast } from "@/components/ui/Toast";
import { getRealtimeSocket } from "@/lib/realtime";
import { useToastStore } from "@/store/useToastStore";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";

export function Providers({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  const [queryClient] = React.useState(() => new QueryClient());
  const { show } = useToastStore();
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = getRealtimeSocket(token);

    socket.on("notification.created", (payload: any) => {
      if (payload?.type === "friend_request") {
        show("Bạn có một lời mời kết bạn mới", "info");
      }
    });

    socket.on("connect_error", (err: any) => {
      if (typeof err?.message === "string" && err.message.includes("jwt expired")) {
        // Token hết hạn: đăng xuất và chuyển về trang đăng nhập
        clearTokens();
        socket.disconnect();
        show("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", "info");
        router.push("/login");
      }
    });

    return () => {
      socket.off("notification.created");
      socket.off("connect_error");
    };
  }, [show, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider {...props}>
        {children}
        <Toast />
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
