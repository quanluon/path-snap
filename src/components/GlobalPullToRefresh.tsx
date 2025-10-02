"use client";

import { useRouter } from "next/navigation";
import PullToRefresh from "./PullToRefresh";

interface GlobalPullToRefreshProps {
  children: React.ReactNode;
}

export default function GlobalPullToRefresh({ children }: GlobalPullToRefreshProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}
