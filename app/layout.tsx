import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TradePulse - AI-Powered Trade Analysis",
  description: "Comprehensive trade analysis platform with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} antialiased`}>
          <div className="min-h-screen bg-background">{children}</div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
