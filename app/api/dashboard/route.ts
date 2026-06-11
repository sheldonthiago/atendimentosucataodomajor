import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalSellers,
      activeSellers,
      allSales,
      monthlySales,
      lastMonthSales,
      topSellers,
      salesByDay,
    ] = await Promise.all([
      prisma.seller.count(),
      prisma.seller.count({ where: { active: true } }),
      prisma.sale.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { status: "completed", saleDate: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          status: "completed",
          saleDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.seller.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          sellerCode: true,
          sales: {
            where: { status: "completed" },
            select: { amount: true },
          },
        },
      }),
      prisma.sale.groupBy({
        by: ["saleDate"],
        where: {
          status: "completed",
          saleDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const topSellersSorted = topSellers
      .map((s) => ({
        id: s.id,
        name: s.name,
        sellerCode: s.sellerCode,
        totalSales: s.sales.length,
        totalRevenue: s.sales.reduce((sum, sale) => sum + sale.amount, 0),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const monthlyData: Record<string, { revenue: number; count: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[key] = { revenue: 0, count: 0 };
    }

    salesByDay.forEach((row) => {
      const d = new Date(row.saleDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += row._sum.amount ?? 0;
        monthlyData[key].count += row._count;
      }
    });

    const chartData = Object.entries(monthlyData).map(([month, data]) => {
      const [year, m] = month.split("-");
      const label = new Date(Number(year), Number(m) - 1, 1).toLocaleDateString(
        "pt-BR",
        { month: "short", year: "2-digit" }
      );
      return { month: label, receita: data.revenue, vendas: data.count };
    });

    const lastMonthRevenue = lastMonthSales._sum.amount ?? 0;
    const currentMonthRevenue = monthlySales._sum.amount ?? 0;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
              1000
          ) / 10
        : 0;

    return NextResponse.json({
      totalSellers,
      activeSellers,
      totalRevenue: allSales._sum.amount ?? 0,
      totalSalesCount: allSales._count,
      monthlyRevenue: currentMonthRevenue,
      monthlySalesCount: monthlySales._count,
      revenueGrowth,
      topSellers: topSellersSorted,
      chartData,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
