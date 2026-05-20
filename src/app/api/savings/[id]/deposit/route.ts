import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id }
  })
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const { amount, note, date } = body

  if (!amount || amount === 0)
    return NextResponse.json({ error: "Jumlah deposit tidak boleh 0" }, { status: 400 })

  const newAmount = Number(goal.currentAmount) + Number(amount)
  const isAchieved = newAmount >= Number(goal.targetAmount)

  const [transaction] = await prisma.$transaction([
    prisma.savingsTransaction.create({
      data: {
        goalId: id,
        userId: user.id,
        amount,
        note: note ?? null,
        date: date ? new Date(date) : new Date(),
      }
    }),
    prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: { increment: amount },
        status: isAchieved ? "TERCAPAI" : "BERLANGSUNG",
      }
    })
  ])

  return NextResponse.json({
    data: transaction,
    message: isAchieved ? "Selamat! Target tabungan tercapai!" : "Deposit berhasil ditambahkan"
  }, { status: 201 })
}