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

  return NextResponse.json({ data: goals, message: "Berhasil mengambil data tabungan" })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const body = await req.json()
  const { name, targetAmount, deadline, planType, planAmount, photoUrl } = body

  if (!name || !targetAmount)
    return NextResponse.json({ error: "Nama dan target tabungan wajib diisi" }, { status: 400 })

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

  return NextResponse.json({ data: goal, message: "Tabungan berhasil dibuat" }, { status: 201 })
}
