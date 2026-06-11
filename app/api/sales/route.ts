import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const PAGE_SIZE = 100;
const ALLOWED_STATUSES = ["completed", "pending", "cancelled"] as const;

const createSchema = z.object({
  sellerCode: z.string().max(20).optional(),
  sellerId: z.number().int().positive().optional(),
  customerName: z.string().min(2).max(100).trim(),
  customerPhone: z
    .string()
    .regex(/^\d{10,11}$/)
    .optional()
    .or(z.literal("")),
  product: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional().or(z.literal("")),
  amount: z.number().positive().max(10_000_000),
  status: z.enum(ALLOWED_STATUSES).default("completed"),
  saleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function isValidDate(s: string): boolean {
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(req.url);
    const sellerIdParam = searchParams.get("sellerId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));

    if (status && !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    if (from && !isValidDate(from)) {
      return NextResponse.json({ error: "Data 'from' inválida" }, { status: 400 });
    }
    if (to && !isValidDate(to)) {
      return NextResponse.json({ error: "Data 'to' inválida" }, { status: 400 });
    }

    const sellerId =
      sellerIdParam && /^\d+$/.test(sellerIdParam)
        ? Number(sellerIdParam)
        : undefined;

    const where: Record<string, unknown> = {};
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = status;
    if (from || to) {
      where.saleDate = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        sellerId: true,
        seller: { select: { name: true, sellerCode: true } },
        customerName: true,
        customerPhone: true,
        product: true,
        description: true,
        amount: true,
        status: true,
        saleDate: true,
      },
      orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
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

    const { sellerCode, sellerId: rawSellerId, saleDate, ...rest } = parsed.data;

    let resolvedSellerId = rawSellerId;

    if (!resolvedSellerId && sellerCode) {
      const seller = await prisma.seller.findUnique({ where: { sellerCode } });
      if (!seller || !seller.active) {
        return NextResponse.json(
          { error: "Código de vendedor inválido ou inativo" },
          { status: 404 }
        );
      }
      resolvedSellerId = seller.id;
    }

    if (!resolvedSellerId) {
      return NextResponse.json(
        { error: "Vendedor é obrigatório" },
        { status: 400 }
      );
    }

    const sellerExists = await prisma.seller.findUnique({
      where: { id: resolvedSellerId, active: true },
    });
    if (!sellerExists) {
      return NextResponse.json(
        { error: "Vendedor não encontrado ou inativo" },
        { status: 404 }
      );
    }

    const sale = await prisma.sale.create({
      data: {
        ...rest,
        sellerId: resolvedSellerId,
        customerPhone: rest.customerPhone || null,
        description: rest.description || null,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
      },
      select: {
        id: true,
        sellerId: true,
        seller: { select: { name: true, sellerCode: true } },
        customerName: true,
        product: true,
        amount: true,
        status: true,
        saleDate: true,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
