import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { customerName, customerPhone, product, description, amount, status, saleDate } = body;

  const sale = await prisma.sale.update({
    where: { id: Number(id) },
    data: {
      customerName,
      customerPhone,
      product,
      description,
      amount: amount ? Number(amount) : undefined,
      status,
      saleDate: saleDate ? new Date(saleDate) : undefined,
    },
  });
  return NextResponse.json(sale);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sale.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
