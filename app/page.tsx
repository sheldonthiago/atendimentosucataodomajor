import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import StatCard from "./components/StatCard";
import SalesChart from "./components/SalesChart";

async function getDashboard() {
  const res = await fetch("http://localhost:3000/api/dashboard", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface TopSeller {
  id: number;
  name: string;
  sellerCode: string;
  whatsapp: string;
  totalSales: number;
  totalRevenue: number;
}

export default async function DashboardPage() {
  const data = await getDashboard();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Erro ao carregar dados do dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral das vendas e vendedores</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Receita Total"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Receita do Mês"
          value={formatCurrency(data.monthlyRevenue)}
          icon={TrendingUp}
          color="blue"
          trend={data.revenueGrowth}
        />
        <StatCard
          title="Total de Vendas"
          value={String(data.totalSalesCount)}
          subtitle={`${data.monthlySalesCount} este mês`}
          icon={ShoppingCart}
          color="yellow"
        />
        <StatCard
          title="Vendedores Ativos"
          value={String(data.activeSellers)}
          subtitle={`${data.totalSellers} cadastrados`}
          icon={Users}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Receita dos Últimos 6 Meses
          </h2>
          <SalesChart data={data.chartData} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Top Vendedores
          </h2>
          {data.topSellers.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum vendedor ainda.</p>
          ) : (
            <ul className="space-y-3">
              {data.topSellers.map((seller: TopSeller, i: number) => (
                <li key={seller.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {seller.name}
                    </p>
                    <p className="text-xs text-gray-400">{seller.sellerCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">
                      {formatCurrency(seller.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-400">{seller.totalSales} vendas</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
