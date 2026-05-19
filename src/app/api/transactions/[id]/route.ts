import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

async function getOwnedTransaction(id: string, userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true }
  })
  const walletIds = wallets.map(w => w.id)
  return prisma.transaction.findFirst({
    where: { id, walletId: { in: walletIds } }
  })
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const tx = await getOwnedTransaction(id, user.id)
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
  return NextResponse.json({
    data: tx,
    message: "Berhasil mengambil detail transaksi"
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const tx = await getOwnedTransaction(id, user.id)
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      description: body.description ?? tx.description,
      category: body.category ?? tx.category,
      note: body.note ?? tx.note,
      date: body.date ? new Date(body.date) : tx.date,
    }
  })
  return NextResponse.json({
    data: updated,
    message: "Transaksi berhasil diperbarui"
  })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  const { id } = await params
  const tx = await getOwnedTransaction(id, user.id)
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.wallet.update({
      where: { id: tx.walletId },
      data: {
        balance: {
          [tx.type === "INCOME" ? "decrement" : "increment"]: tx.amount
        }
      }
    })
  ])
  return NextResponse.json({ message: "Transaksi berhasil dihapus" })
}