"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Trash2 } from "lucide-react";

interface Seller {
  id: number;
  name: string;
  sellerCode: string;
}

interface Sale {
  id: number;
  sellerId: number;
  seller: { name: string; sellerCode: string };
  customerName: string;
  customerPhone?: string;
  product: string;
  description?: string;
  amount: number;
  status: string;
  saleDate: string;
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Concluída",
  pending: "Pendente",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-700",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sellerId: "",
    customerName: "",
    customerPhone: "",
    product: "",
    description: "",
    amount: "",
    status: "completed",
    saleDate: new Date().toISOString().split("T")[0],
  });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSeller) params.set("sellerId", filterSeller);
    if (filterStatus) params.set("status", filterStatus);
    const [salesRes, sellersRes] = await Promise.all([
      fetch(`/api/sales?${params}`),
      fetch("/api/sellers"),
    ]);
    setSales(await salesRes.json());
    setSellers(await sellersRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSeller, filterStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sellerId: Number(form.sellerId),
        amount: Number(form.amount),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao cadastrar venda");
      setSaving(false);
      return;
    }
    setShowForm(false);
    setForm({
      sellerId: "",
      customerName: "",
      customerPhone: "",
      product: "",
      description: "",
      amount: "",
      status: "completed",
      saleDate: new Date().toISOString().split("T")[0],
    });
    await load();
    setSaving(false);
  }

  async function deleteSale(id: number) {
    if (!confirm("Excluir esta venda?")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = sales.filter(
    (s) =>
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.product.toLowerCase().includes(search.toLowerCase()) ||
      s.seller.name.toLowerCase().includes(search.toLowerCase()) ||
      s.seller.sellerCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filtered
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-500 mt-1">Registro e acompanhamento de vendas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registrar Venda</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendedor *
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.sellerId}
                  onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                >
                  <option value="">Selecione o vendedor</option>
                  {sellers
                    .filter((s) => (s as Seller & { active?: boolean }).active !== false)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.sellerCode})
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone cliente
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm({ ...form, customerPhone: e.target.value })
                    }
                    placeholder="11999999999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto/Serviço *
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  placeholder="Ex: Ferro velho, sucata de cobre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="completed">Concluída</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.saleDate}
                    onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                  />
                </div>
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
                  {saving ? "Salvando..." : "Registrar Venda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
          >
            <option value="">Todos os vendedores</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="completed">Concluídas</option>
            <option value="pending">Pendentes</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        {filtered.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <span>{filtered.length} venda(s)</span>
            <span className="font-bold text-green-700">
              {formatCurrency(totalFiltered)}
            </span>
          </div>
        )}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-gray-400 text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          Nenhuma venda encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Data
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {sale.seller.name}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {sale.seller.sellerCode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-xs text-gray-400">
                          {sale.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{sale.product}</div>
                      {sale.description && (
                        <div className="text-xs text-gray-400 max-w-xs truncate">
                          {sale.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[sale.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[sale.status] || sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteSale(sale.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
