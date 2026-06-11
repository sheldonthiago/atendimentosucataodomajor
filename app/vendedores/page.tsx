"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MessageCircle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
} from "lucide-react";

interface Seller {
  id: number;
  name: string;
  sellerCode: string;
  whatsapp: string;
  email?: string;
  active: boolean;
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function formatWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export default function VendedoresPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sellers");
    const data = await res.json();
    setSellers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao cadastrar vendedor");
      setSaving(false);
      return;
    }
    setShowForm(false);
    setForm({ name: "", whatsapp: "", email: "" });
    await load();
    setSaving(false);
  }

  async function toggleActive(seller: Seller) {
    await fetch(`/api/sellers/${seller.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...seller, active: !seller.active }),
    });
    await load();
  }

  function copyCode(id: number, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sellerCode.toLowerCase().includes(search.toLowerCase()) ||
      s.whatsapp.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-500 mt-1">
            Gerencie vendedores identificados por código único
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Vendedor
        </button>
      </div>

      {/* Modal de cadastro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Cadastrar Vendedor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="João da Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp * (somente números)
                </label>
                <input
                  required
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="11999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@email.com"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Buscar vendedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-gray-400 text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          Nenhum vendedor encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((seller) => (
            <div
              key={seller.id}
              className={`bg-white rounded-xl border shadow-sm p-5 space-y-3 ${
                seller.active ? "border-gray-100" : "border-red-100 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{seller.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded font-mono">
                      {seller.sellerCode}
                    </span>
                    <button
                      onClick={() => copyCode(seller.id, seller.sellerCode)}
                      className="text-gray-400 hover:text-green-700 transition-colors"
                      title="Copiar código"
                    >
                      {copiedId === seller.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(seller)}
                  title={seller.active ? "Desativar" : "Ativar"}
                  className="text-gray-400 hover:text-gray-700"
                >
                  {seller.active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>{formatWhatsApp(seller.whatsapp)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400">Vendas</p>
                  <p className="text-sm font-bold text-gray-800">
                    {seller.totalSales}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Receita</p>
                  <p className="text-sm font-bold text-green-700">
                    {formatCurrency(seller.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
