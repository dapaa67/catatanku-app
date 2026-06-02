import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "https://yobby15-catatanku-fastapi.hf.space"

async function getOwnedGoal(id: string, userId: string) {
  return prisma.savingsGoal.findFirst({
    where: { id, userId },
    include: {
      savingsTransactions: {
        orderBy: { date: "asc" },
        take: 6
      }
    }
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
  const newTarget = body.targetAmount !== undefined ? Number(body.targetAmount) : Number(goal.targetAmount)
  const newPlanAmount = body.planAmount !== undefined ? Number(body.planAmount) : (goal.planAmount ? Number(goal.planAmount) : null)
  const newPlanType = body.planType !== undefined ? body.planType : goal.planType

  const targetChanged = newTarget !== Number(goal.targetAmount)
  const planChanged = newPlanAmount !== (goal.planAmount ? Number(goal.planAmount) : null)

  const isAchieved = Number(goal.currentAmount) >= newTarget

  // Hitung deadline baru jika target atau plan berubah
  let newDeadline = goal.deadline
  let estimasiKaliNabung: number | null = null

  if (!isAchieved && (targetChanged || planChanged) && goal.savingsTransactions.length > 0) {
    try {
      const lima = goal.savingsTransactions.slice(-5)
      const riwayat = lima.map((t, i) => {
        const prev = lima[i - 1]
        const jarakHari = prev
          ? Math.max(1, Math.round(
              (new Date(t.date).getTime() - new Date(prev.date).getTime())
              / (1000 * 60 * 60 * 24)
            ))
          : 1

        return {
          target_nominal: newTarget,
          nominal_nabung: Number(t.amount),
          total_terkumpul: Number(goal.currentAmount),
          jarak_hari_nabung: jarakHari
        }
      })

      const aiRes = await fetch(`${FASTAPI_URL}/api/predict/tabungan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riwayat }),
        signal: AbortSignal.timeout(8000)
      })

      if (aiRes.ok) {
        const aiData = await aiRes.json()
        estimasiKaliNabung = aiData.estimasi_kali_nabung ?? null

        if (estimasiKaliNabung && newPlanType) {
          const hariPerPeriode = newPlanType === "HARIAN" ? 1
            : newPlanType === "MINGGUAN" ? 7
            : 30
          const estimasiHari = estimasiKaliNabung * hariPerPeriode
          newDeadline = new Date()
          newDeadline.setDate(newDeadline.getDate() + estimasiHari)
        }
      }
    } catch (err) {
      // Fallback kalau AI down
      console.warn("AI predict gagal saat edit, pakai fallback manual:", err)
      if (newPlanAmount && newPlanAmount > 0) {
        const sisa = newTarget - Number(goal.currentAmount)
        estimasiKaliNabung = sisa > 0 ? Math.ceil(sisa / newPlanAmount) : 0
        const hariPerPeriode = newPlanType === "HARIAN" ? 1
          : newPlanType === "MINGGUAN" ? 7
          : 30
        newDeadline = new Date()
        newDeadline.setDate(newDeadline.getDate() + estimasiKaliNabung * hariPerPeriode)
      }
    }
  }

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: body.name ?? goal.name,
      targetAmount: newTarget,
      deadline: newDeadline,
      planType: newPlanType ?? goal.planType,
      planAmount: newPlanAmount ?? goal.planAmount,
      photoUrl: body.photoUrl !== undefined ? body.photoUrl : goal.photoUrl,
      status: isAchieved ? "TERCAPAI" : "BERLANGSUNG",
    }
  })

  return NextResponse.json({
    data: { ...updated, estimasiKaliNabung },
    message: "Tabungan berhasil diperbarui"
  })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  await prisma.savingsGoal.delete({ where: { id } })

  return NextResponse.json({ message: "Tabungan berhasil dihapus" })
}