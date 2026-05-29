import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { savingsTransactions: { orderBy: { date: "desc" }, take: 5 } }
  })

  const data = goals.map(g => ({
    ...g,
    progressPercent: Number(g.targetAmount) > 0
      ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
      : 0,
    remainingAmount: Number(g.targetAmount) - Number(g.currentAmount)
  }))

  return NextResponse.json({ data, message: "Berhasil mengambil data tabungan" })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const body = await req.json()
  const { name, targetAmount, deadline, planType, planAmount, photoUrl, initialDeposit } = body

  if (!name || !targetAmount)
    return NextResponse.json({ error: "Nama dan target tabungan wajib diisi" }, { status: 400 })

  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        planType: planType ?? null,
        planAmount: planAmount ?? null,
        photoUrl: photoUrl ?? null,
      }
    })

    // TODO (Backend):
    // Pas bikin tabungan baru, tolong hitung manual estimasi_kali_nabung = targetAmount / planAmount.
    // Hasil hitungannya diselipin ke dalam JSON response balikan (sebagai estimasi_kali_nabung)
    // biar Frontend bisa nampilin datanya.

    if (initialDeposit && Number(initialDeposit) > 0) {
      await prisma.savingsTransaction.create({
        data: {
          goalId: goal.id,
          userId: user.id,
          amount: initialDeposit,
          note: "Setoran Awal",
          date: new Date()
        }
      })
    }

    return NextResponse.json({
      data: goal,
      message: "Tabungan berhasil dibuat"
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating savings goal:", error)
    return NextResponse.json({ error: "Gagal membuat tabungan" }, { status: 500 })
  }
}