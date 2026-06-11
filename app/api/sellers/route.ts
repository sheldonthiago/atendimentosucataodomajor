import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateSellerCode(): string {
  const prefix = "VND";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${number}`;
}

export async function GET() {
  const sellers = await prisma.seller.findMany({
    include: {
      _count: { select: { sales: true } },
      sales: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = sellers.map((s) => ({
    ...s,
    totalSales: s.sales.filter((sale) => sale.status === "completed").length,
    totalRevenue: s.sales
      .filter((sale) => sale.status === "completed")
      .reduce((sum, sale) => sum + sale.amount, 0),
    sales: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, whatsapp, email } = body;

  if (!name || !whatsapp) {
    return NextResponse.json(
      { error: "Nome e WhatsApp são obrigatórios" },
      { status: 400 }
    );
  }

  const existing = await prisma.seller.findUnique({ where: { whatsapp } });
  if (existing) {
    return NextResponse.json(
      { error: "WhatsApp já cadastrado" },
      { status: 409 }
    );
  }

  let sellerCode = generateSellerCode();
  let codeExists = await prisma.seller.findUnique({ where: { sellerCode } });
  while (codeExists) {
    sellerCode = generateSellerCode();
    codeExists = await prisma.seller.findUnique({ where: { sellerCode } });
  }

  const seller = await prisma.seller.create({
    data: { name, whatsapp, email: email || null, sellerCode },
  });

  return NextResponse.json(seller, { status: 201 });
}
