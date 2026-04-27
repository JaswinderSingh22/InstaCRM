import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-auth",
  display: "swap",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.className} font-sans antialiased`}>{children}</div>;
}
