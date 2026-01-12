import { Montserrat, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { AuthProvider } from "@/context/AuthProvider";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "⚡ CodeRev - AI Code Editor",
  description: "New generated code editor with AI-powered suggestions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <Provider>
            {children}
            <Toaster richColors closeButton position="top-right" theme="system" />
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}

