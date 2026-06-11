import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (sellerId) where.sellerId = Number(sellerId);
  if (status) where.status = status;
  if (from || to) {
    where.saleDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { seller: { select: { name: true, sellerCode: true } } },
    orderBy: { saleDate: "desc" },
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    sellerCode,
    sellerId,
    customerName,
    customerPhone,
    product,
    description,
    amount,
    status,
    saleDate,
  } = body;

  let resolvedSellerId = sellerId;

  if (!resolvedSellerId && sellerCode) {
    const seller = await prisma.seller.findUnique({ where: { sellerCode } });
    if (!seller) {
      return NextResponse.json(
        { error: "Código de vendedor inválido" },
        { status: 404 }
      );
    }
    resolvedSellerId = seller.id;
  }

  if (!resolvedSellerId) {
    return NextResponse.json(
      { error: "Vendedor é obrigatório (sellerId ou sellerCode)" },
      { status: 400 }
    );
  }

  if (!customerName || !product || !amount) {
    return NextResponse.json(
      { error: "Cliente, produto e valor são obrigatórios" },
      { status: 400 }
    );
  }

  const sale = await prisma.sale.create({
    data: {
      sellerId: resolvedSellerId,
      customerName,
      customerPhone: customerPhone || null,
      product,
      description: description || null,
      amount: Number(amount),
      status: status || "completed",
      saleDate: saleDate ? new Date(saleDate) : new Date(),
    },
    include: { seller: { select: { name: true, sellerCode: true } } },
  });

  return NextResponse.json(sale, { status: 201 });
}
