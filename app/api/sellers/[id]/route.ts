import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  whatsapp: z
    .string()
    .regex(/^\d{10,11}$/, "WhatsApp deve ter 10 ou 11 dígitos")
    .optional(),
  email: z.string().email().max(200).optional().or(z.literal("")).or(z.null()),
  active: z.boolean().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(
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

    const seller = await prisma.seller.findUnique({
      where: { id: numId },
      select: {
        id: true,
        name: true,
        sellerCode: true,
        whatsapp: true,
        email: true,
        active: true,
        createdAt: true,
        sales: {
          orderBy: { saleDate: "desc" },
          take: 200,
          select: {
            id: true,
            product: true,
            amount: true,
            status: true,
            saleDate: true,
            customerName: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    return NextResponse.json(seller);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
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

    const existing = await prisma.seller.findUnique({ where: { id: numId } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const seller = await prisma.seller.update({
      where: { id: numId },
      data: parsed.data,
      select: { id: true, name: true, sellerCode: true, whatsapp: true, active: true },
    });

    return NextResponse.json(seller);
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

    const existing = await prisma.seller.findUnique({ where: { id: numId } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.seller.update({
      where: { id: numId },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
