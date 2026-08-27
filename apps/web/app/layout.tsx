import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { cn } from "@workspace/ui/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "crazp — Build agents that work across your stack",
  description:
    "Most real work crosses more than one tool. Build agents that own those workflows, you set the role, they handle what comes next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <head />
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          geist.variable,
          fontMono.variable
        )}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
