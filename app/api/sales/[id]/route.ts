import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const ALLOWED_STATUSES = ["completed", "pending", "cancelled"] as const;

const updateSchema = z.object({
  customerName: z.string().min(2).max(100).trim().optional(),
  customerPhone: z
    .string()
    .regex(/^\d{10,11}$/)
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  product: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional().or(z.literal("")).or(z.null()),
  amount: z.number().positive().max(10_000_000).optional(),
  status: z.enum(ALLOWED_STATUSES).optional(),
  saleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId < 1) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const existing = await prisma.sale.findUnique({ where: { id: numId } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { saleDate, ...rest } = parsed.data;
    const sale = await prisma.sale.update({
      where: { id: numId },
      data: {
        ...rest,
        ...(saleDate ? { saleDate: new Date(saleDate) } : {}),
      },
      select: { id: true, product: true, amount: true, status: true, saleDate: true },
    });

    return NextResponse.json(sale);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId < 1) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existing = await prisma.sale.findUnique({ where: { id: numId } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.sale.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
