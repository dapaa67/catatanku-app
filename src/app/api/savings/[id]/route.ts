import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

async function getOwnedGoal(id: string, userId: string) {
  return prisma.savingsGoal.findFirst({
    where: { id, userId }
  })
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
    include: { savingsTransactions: { orderBy: { date: "desc" } } }
  })

  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  return NextResponse.json({
    data: {
      ...goal,
      // Verifikasi kepemilikan tabungan
      progressPercent: Number(goal.targetAmount) > 0
        ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
        : 0,
      remainingAmount: Number(goal.targetAmount) - Number(goal.currentAmount)
    },
    message: "Berhasil mengambil detail tabungan"
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params
  const goal = await getOwnedGoal(id, user.id)
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const newTarget = body.targetAmount ?? Number(goal.targetAmount)
  const isAchieved = Number(goal.currentAmount) >= newTarget

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: body.name ?? goal.name,
      targetAmount: newTarget,
      deadline: body.deadline ? new Date(body.deadline) : goal.deadline,
      planType: body.planType ?? goal.planType,
      planAmount: body.planAmount ?? goal.planAmount,
      photoUrl: body.photoUrl ?? goal.photoUrl,
      status: isAchieved ? "TERCAPAI" : "BERLANGSUNG",
    }
  })

  return NextResponse.json({ data: updated, message: "Tabungan berhasil diperbarui" })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params
  const goal = await getOwnedGoal(id, user.id)
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  await prisma.savingsGoal.delete({ where: { id } })

  return NextResponse.json({ message: "Tabungan berhasil dihapus" })
}