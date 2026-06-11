import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sucata do Major — Painel de Vendas",
  description: "Dashboard de vendas com gestão de vendedores via WhatsApp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-gray-50 text-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </body>
    </html>
  );
}
