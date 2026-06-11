import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const PAGE_SIZE = 100;

const createSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  whatsapp: z
    .string()
    .regex(/^\d{10,11}$/, "WhatsApp deve ter 10 ou 11 dígitos"),
  email: z.string().email().max(200).optional().or(z.literal("")),
});

function generateSellerCode(): string {
  return "VND" + randomBytes(4).toString("hex").toUpperCase().slice(0, 5);
}

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));

    const sellers = await prisma.seller.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        sales: { select: { amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = sellers.map((s) => ({
      id: s.id,
      name: s.name,
      sellerCode: s.sellerCode,
      whatsapp: s.whatsapp,
      active: s.active,
      createdAt: s.createdAt,
      totalSales: s.sales.filter((sale) => sale.status === "completed").length,
      totalRevenue: s.sales
        .filter((sale) => sale.status === "completed")
        .reduce((sum, sale) => sum + sale.amount, 0),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, whatsapp, email } = parsed.data;

    const existing = await prisma.seller.findUnique({ where: { whatsapp } });
    if (existing) {
      return NextResponse.json(
        { error: "WhatsApp já cadastrado" },
        { status: 409 }
      );
    }

    let sellerCode = generateSellerCode();
    let attempts = 0;
    while (
      (await prisma.seller.findUnique({ where: { sellerCode } })) &&
      attempts++ < 10
    ) {
      sellerCode = generateSellerCode();
    }

    const seller = await prisma.seller.create({
      data: { name, whatsapp, email: email || null, sellerCode },
      select: { id: true, name: true, sellerCode: true, whatsapp: true, active: true, createdAt: true },
    });

    return NextResponse.json(seller, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
