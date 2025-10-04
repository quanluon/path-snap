import type { Metadata, Viewport } from "next";
import { Open_Sans, Roboto, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { UserProvider } from "@/contexts/UserContext";
import { ReactionProvider } from "@/contexts/ReactionContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import GlobalPullToRefresh from "@/components/GlobalPullToRefresh";
import NotificationListener from "@/components/NotificationListener";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import ToastContainer from "@/components/ToastContainer";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checkpoint - Location Photo App",
  description: "Capture and share photos with location tags",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Checkpoint",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${openSans.variable} ${roboto.variable} ${poppins.variable} ${jetbrainsMono.variable} antialiased bg-dark-gradient min-h-screen`}
      >
        <LanguageProvider>
          <UserProvider>
            <ReactionProvider>
              <PlanProvider>
                <ToastProvider>
                  <NotificationListener>
                    <GlobalPullToRefresh>
                      <Header />
                      <main className="min-h-screen pb-20 md:pb-8 bg-dark-gradient px-4 pt-10">
                        {children}
                      </main>
                      <Navigation />
                    </GlobalPullToRefresh>
                    <NotificationPermissionPrompt />
                    <ToastContainer />
                  </NotificationListener>
                </ToastProvider>
              </PlanProvider>
            </ReactionProvider>
          </UserProvider>
        </LanguageProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
