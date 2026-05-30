import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "https://yobby15-catatanku-fastapi.hf.space"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { id } = await params

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
    include: {
      savingsTransactions: {
        orderBy: { date: "asc" },
        take: 6 // ambil 6 buat hitung 5 selisih hari
      }
    }
  })

  if (!goal) return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const { amount, note, date } = body

  if (amount === undefined || amount === null || Number(amount) === 0)
    return NextResponse.json({ error: "Jumlah deposit tidak boleh 0" }, { status: 400 })

  const newAmount = Number(goal.currentAmount) + Number(amount)
  if (newAmount < 0)
    return NextResponse.json({ error: "Koreksi melebihi jumlah tabungan yang ada" }, { status: 400 })

  const isAchieved = newAmount >= Number(goal.targetAmount)

  const [transaction, updatedGoal] = await prisma.$transaction([
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

  // ====== PREDIKSI AI ======
  let estimasiKaliNabung: number | null = null

  try {
    // Gabungkan transaksi lama + transaksi baru yang baru disimpan
    const semuaTransaksi = [
      ...goal.savingsTransactions,
      { ...transaction, date: transaction.date }
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Ambil 5 terakhir setelah transaksi baru masuk
    const lima = semuaTransaksi.slice(-5)

    // Hitung selisih hari antar transaksi
    // Transaksi pertama di array tidak punya "selisih" dari sebelumnya,
    // jadi kita hitung dari index 1 ke atas
    const riwayat = lima.map((t, i) => {
      const prev = lima[i - 1]
      const jarakHari = prev
        ? Math.max(1, Math.round(
            (new Date(t.date).getTime() - new Date(prev.date).getTime())
            / (1000 * 60 * 60 * 24)
          ))
        : 1 // transaksi pertama, default 1

      return {
        target_nominal: Number(goal.targetAmount),
        nominal_nabung: Number(t.amount),
        total_terkumpul: Number(updatedGoal.currentAmount),
        jarak_hari_nabung: jarakHari
      }
    })

    const aiRes = await fetch(`${FASTAPI_URL}/api/predict/tabungan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riwayat }),
      signal: AbortSignal.timeout(8000) // timeout 8 detik
    })

    if (aiRes.ok) {
      const aiData = await aiRes.json()
      estimasiKaliNabung = aiData.estimasi_kali_nabung ?? null

      // Update deadline berdasarkan estimasi AI
      if (estimasiKaliNabung && goal.planType) {
        const hariPerPeriode = goal.planType === "HARIAN" ? 1
          : goal.planType === "MINGGUAN" ? 7
          : 30 // BULANAN

        const estimasiHari = estimasiKaliNabung * hariPerPeriode
        const newDeadline = new Date()
        newDeadline.setDate(newDeadline.getDate() + estimasiHari)

        await prisma.savingsGoal.update({
          where: { id },
          data: { deadline: newDeadline }
        })
      }
    }
  } catch (err) {
    // Fallback manual kalau AI down
    console.warn("AI predict gagal, pakai fallback manual:", err)
    if (goal.planAmount && Number(goal.planAmount) > 0) {
      const sisa = Number(goal.targetAmount) - newAmount
      estimasiKaliNabung = sisa > 0 ? Math.ceil(sisa / Number(goal.planAmount)) : 0
    }
  }

  return NextResponse.json({
    data: {
      ...transaction,
      estimasiKaliNabung
    },
    message: isAchieved ? "Selamat! Target tabungan tercapai" : "Deposit berhasil ditambahkan"
  }, { status: 201 })
}