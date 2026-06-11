"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  month: string;
  receita: number;
  vendas: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SalesChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
        <YAxis
          yAxisId="left"
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          width={80}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          width={30}
        />
        <Tooltip
          formatter={(value, name) => {
            const v = Number(value);
            return name === "receita"
              ? [formatCurrency(v), "Receita"]
              : [v, "Qtd. Vendas"];
          }}
        />
        <Legend
          formatter={(value) => (value === "receita" ? "Receita" : "Qtd. Vendas")}
        />
        <Bar yAxisId="left" dataKey="receita" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="vendas" fill="#86efac" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
