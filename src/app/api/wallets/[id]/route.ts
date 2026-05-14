import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const wallet = await prisma.wallet.findFirst({ where: { id, userId: user.id } })
  if (!wallet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ data: wallet, message: "Berhasil mengambil detail dompet" })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const wallet = await prisma.wallet.findFirst({ where: { id, userId: user.id } })
  if (!wallet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.wallet.update({
    where: { id },
    data: { name: body.name ?? wallet.name, color: body.color ?? wallet.color }
  })
  return NextResponse.json({ data: updated, message: "Dompet berhasil diperbarui" })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const wallet = await prisma.wallet.findFirst({ where: { id, userId: user.id } })
  if (!wallet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 })
  await prisma.wallet.delete({ where: { id } })
  return NextResponse.json({ message: "Dompet berhasil dihapus" })
}