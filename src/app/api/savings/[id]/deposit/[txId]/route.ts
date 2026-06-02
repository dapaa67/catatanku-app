import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, txId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id, txId } = await params

  // Pastikan goal & transaksi ada dan milik user
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  const tx = await prisma.savingsTransaction.findFirst({ where: { id: txId, goalId: id, userId: user.id } })
  if (!tx) return NextResponse.json({ error: "Riwayat tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const newAmount = body.amount !== undefined ? Number(body.amount) : Number(tx.amount)
  const newNote = body.note !== undefined ? body.note : tx.note

  if (newAmount === 0) return NextResponse.json({ error: "Nominal tidak boleh 0" }, { status: 400 })

  // Hitung selisih untuk mengupdate total tabungan
  const diff = newAmount - Number(tx.amount)
  const updatedCurrentAmount = Number(goal.currentAmount) + diff

  const isAchieved = updatedCurrentAmount >= Number(goal.targetAmount)

  await prisma.$transaction([
    prisma.savingsTransaction.update({
      where: { id: txId },
      data: { amount: newAmount, note: newNote }
    }),
    prisma.savingsGoal.update({
      where: { id },
      data: { 
        currentAmount: updatedCurrentAmount,
        status: isAchieved ? "TERCAPAI" : "BERLANGSUNG"
      }
    })
  ])

  return NextResponse.json({ message: "Riwayat berhasil diupdate" })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string, txId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id, txId } = await params

  // Pastikan goal & transaksi ada dan milik user
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  const tx = await prisma.savingsTransaction.findFirst({ where: { id: txId, goalId: id, userId: user.id } })
  if (!tx) return NextResponse.json({ error: "Riwayat tidak ditemukan" }, { status: 404 })

  // Hitung saldo tabungan yang baru setelah transaksi ini dihapus
  const updatedCurrentAmount = Number(goal.currentAmount) - Number(tx.amount)
  const isAchieved = updatedCurrentAmount >= Number(goal.targetAmount)

  await prisma.$transaction([
    prisma.savingsTransaction.delete({
      where: { id: txId }
    }),
    prisma.savingsGoal.update({
      where: { id },
      data: { 
        currentAmount: Math.max(0, updatedCurrentAmount), // jangan sampai minus
        status: isAchieved ? "TERCAPAI" : "BERLANGSUNG"
      }
    })
  ])

  return NextResponse.json({ message: "Riwayat berhasil dihapus" })
}
