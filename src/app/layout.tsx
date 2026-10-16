import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/shared/service-worker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Study Smart AI — Study less, learn more",
    template: "%s · Study Smart AI",
  },
  description:
    "An AI study companion that turns your notes into quizzes, summaries, flashcards, and a personalized timetable — so you know exactly what to study next.",
  keywords: [
    "study planner",
    "AI quiz generator",
    "flashcards",
    "exam timetable",
    "study tracker",
  ],
  manifest: "/manifest.webmanifest",
  applicationName: "Study Smart AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Study Smart AI",
  },
  openGraph: {
    title: "Study Smart AI — Study less, learn more",
    description:
      "Turn your notes into quizzes, summaries and a smart timetable with AI.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a1d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
