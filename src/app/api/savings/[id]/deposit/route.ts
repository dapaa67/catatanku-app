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

  if (amount === undefined || amount === null || Number(amount) === 0)
    return NextResponse.json({ error: "Jumlah deposit tidak boleh 0" }, { status: 400 })

  const newAmount = Number(goal.currentAmount) + Number(amount)
  if (newAmount < 0)
    return NextResponse.json({ error: "Koreksi melebihi jumlah tabungan yang ada" }, { status: 400 })

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

  // TODO (Backend):
  // ====== PREDIKSI AI ======
  // 1. Ambil 6 transaksi terakhir secara kronologis.
  // 2. Olah jadi array `riwayat` (isinya: target_nominal, nominal_nabung, total_terkumpul, jarak_hari_nabung).
  // 3. Tembak array tersebut ke API FastAPI lo via POST request.
  // 4. Tangkap balikan `estimasi_kali_nabung` dari AI-nya, lalu pake angkanya buat UPDATE kolom `deadline` di tabel SavingsGoal.
  // 5. Jangan lupa siapin fallback manual kalau server AI lagi down/error.
  // 6. Selipin juga angka `estimasi_kali_nabung` ke dalam object JSON response di bawah ini, biar Frontend bisa trigger Modal Sukses.

  return NextResponse.json({
    data: transaction,
    message: isAchieved ? "Selamat! Target tabungan tercapai" : "Deposit berhasil ditambahkan"
  }, { status: 201 })
}