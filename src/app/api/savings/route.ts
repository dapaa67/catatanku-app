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
    remainingAmount: Number(g.targetAmount) - Number(g.currentAmount),
    // Estimasi sisa kali nabung berdasarkan saldo sekarang
    estimasiKaliNabung: g.planAmount && Number(g.planAmount) > 0
      ? Math.ceil((Number(g.targetAmount) - Number(g.currentAmount)) / Number(g.planAmount))
      : null
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
    const hasInitialDeposit = initialDeposit && Number(initialDeposit) > 0

    // Buat goal, kalau ada initialDeposit langsung update currentAmount sekalian
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        currentAmount: hasInitialDeposit ? Number(initialDeposit) : 0,
        deadline: deadline ? new Date(deadline) : null,
        planType: planType ?? null,
        planAmount: planAmount ?? null,
        photoUrl: photoUrl ?? null,
      }
    })

    if (hasInitialDeposit) {
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

    // Hitung estimasi kali nabung dari awal (pakai currentAmount yang sudah include initialDeposit)
    const currentAmount = hasInitialDeposit ? Number(initialDeposit) : 0
    const estimasiKaliNabung = planAmount && Number(planAmount) > 0
      ? Math.ceil((Number(targetAmount) - currentAmount) / Number(planAmount))
      : null

    return NextResponse.json({
      data: {
        ...goal,
        currentAmount,
        estimasiKaliNabung
      },
      message: "Tabungan berhasil dibuat"
    }, { status: 201 })

  } catch (error: unknown) {
    console.error("Error creating savings goal:", error)
    return NextResponse.json({ error: "Gagal membuat tabungan" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  try {
    const body = await req.json()
    const { goalIds } = body

    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: "ID Tabungan tidak valid" }, { status: 400 })
    }

    // Verify ownership
    const goals = await prisma.savingsGoal.findMany({
      where: { id: { in: goalIds }, userId: user.id }
    })

    const validGoalIds = goals.map(g => g.id)

    if (validGoalIds.length === 0) {
      return NextResponse.json({ error: "Tidak ada tabungan yang valid untuk dihapus" }, { status: 403 })
    }

    await prisma.savingsTransaction.deleteMany({
      where: { goalId: { in: validGoalIds } }
    })

    await prisma.savingsGoal.deleteMany({
      where: { id: { in: validGoalIds } }
    })

    return NextResponse.json({ message: "Berhasil menghapus tabungan yang dipilih" })
  } catch (error: unknown) {
    console.error("Bulk delete savings error:", error)
    return NextResponse.json({ error: "Gagal menghapus tabungan massal" }, { status: 500 })
  }
}