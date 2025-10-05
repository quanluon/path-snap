"use client";

import { useRouter } from "next/navigation";
import PullToRefresh from "react-simple-pull-to-refresh";
import { useLanguage } from "@/contexts/LanguageContext";

interface GlobalPullToRefreshProps {
  children: React.ReactNode;
}

export default function GlobalPullToRefresh({ children }: GlobalPullToRefreshProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleRefresh = async () => {
    router.refresh();
    window?.location?.reload();
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={100}
      pullingContent={
        <div className="flex items-center justify-center py-4 bg-black/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white ml-3 font-medium">{t.common.refreshing}</span>
        </div>
      }
      refreshingContent={
        <div className="flex items-center justify-center py-4 bg-black/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white ml-3 font-medium">{t.common.refreshing}</span>
        </div>
      }
      canFetchMore={false}
      className="min-h-screen"
    >
      {children}
    </PullToRefresh>
  );
}
