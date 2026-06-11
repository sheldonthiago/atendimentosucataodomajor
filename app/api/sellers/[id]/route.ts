import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const seller = await prisma.seller.findUnique({
    where: { id: Number(id) },
    include: { sales: { orderBy: { saleDate: "desc" } } },
  });
  if (!seller) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(seller);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, whatsapp, email, active } = body;

  const seller = await prisma.seller.update({
    where: { id: Number(id) },
    data: { name, whatsapp, email, active },
  });
  return NextResponse.json(seller);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.seller.update({
    where: { id: Number(id) },
    data: { active: false },
  });
  return NextResponse.json({ success: true });
}
