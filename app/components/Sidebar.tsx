"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendedores", label: "Vendedores", icon: Users },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-300" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Sucata do Major</h1>
            <p className="text-green-400 text-xs">Painel de Vendas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-green-600 text-white"
                  : "text-green-200 hover:bg-green-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-700 text-green-400 text-xs text-center">
        Versão 1.0
      </div>
    </aside>
  );
}
