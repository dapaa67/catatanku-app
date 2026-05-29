import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const walletId = searchParams.get("walletId")
  const type = searchParams.get("type")
  const category = searchParams.get("category")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: { id: true }
  })
  const walletIds = wallets.map(w => w.id)

  const transactions = await prisma.transaction.findMany({
    where: {
      walletId: walletId && walletId !== "all" ? walletId : { in: walletIds },
      ...(type && { type: type as "INCOME" | "EXPENSE" }),
      ...(category && { category }),
      ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } })
    },
    orderBy: { date: "desc" },
    include: { wallet: { select: { name: true, color: true } } }
  })

  return NextResponse.json({
    data: transactions,
    message: "Berhasil mengambil data transaksi"
  })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const body = await req.json()
  const { walletId, type, amount, description, category, date, note, photoUrl, aiTrainingData } = body

  if (!walletId || !type || !amount || !description || !category)
    return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 })

  if (!["INCOME", "EXPENSE"].includes(type))
    return NextResponse.json({ error: "Tipe transaksi tidak valid, gunakan INCOME atau EXPENSE" }, { status: 400 })

  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId: user.id }
  })
  if (!wallet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 })

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId,
        type,
        amount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
        note,
        photoUrl
      }
    }),
    prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          [type === "INCOME" ? "increment" : "decrement"]: amount
        }
      }
    }),
    ...(aiTrainingData ? [
      prisma.aiTrainingData.create({
        data: {
          inputText: aiTrainingData.inputText,
          guessedCategory: aiTrainingData.guessedCategory,
          correctCategory: aiTrainingData.correctCategory,
          isCorrect: aiTrainingData.isCorrect
        }
      })
    ] : [])
  ])

  return NextResponse.json({
    data: transaction,
    message: "Transaksi berhasil ditambahkan"
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  try {
    const body = await req.json()
    const { transactionIds } = body

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: "Tidak ada transaksi yang dipilih untuk dihapus" }, { status: 400 })
    }

    // Ambil detail transaksi untuk mengembalikan saldo
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        wallet: { userId: user.id } // Pastikan transaksi milik user yang login
      },
      select: { id: true, amount: true, type: true, walletId: true }
    })

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan atau tidak ada akses" }, { status: 404 })
    }

    // Kalkulasi perubahan saldo per wallet
    const walletBalanceUpdates: Record<string, number> = {}
    
    for (const t of transactions) {
      if (!walletBalanceUpdates[t.walletId]) {
        walletBalanceUpdates[t.walletId] = 0
      }
      
      // Jika yang dihapus INCOME, saldo harus berkurang. Jika EXPENSE, saldo harus bertambah.
      if (t.type === "INCOME") {
        walletBalanceUpdates[t.walletId] -= Number(t.amount)
      } else {
        walletBalanceUpdates[t.walletId] += Number(t.amount)
      }
    }

    // Siapkan array promise untuk prisma.$transaction
    const prismaOperations = []

    // 1. Update saldo semua wallet yang terdampak
    for (const [walletId, amountChange] of Object.entries(walletBalanceUpdates)) {
      prismaOperations.push(
        prisma.wallet.update({
          where: { id: walletId },
          data: {
            balance: {
              increment: amountChange // Bisa negatif atau positif
            }
          }
        })
      )
    }

    // 2. Hapus transaksinya
    const idsToDelete = transactions.map(t => t.id)
    prismaOperations.push(
      prisma.transaction.deleteMany({
        where: { id: { in: idsToDelete } }
      })
    )

    // Eksekusi semua secara atomik
    await prisma.$transaction(prismaOperations)

    return NextResponse.json({
      message: `Berhasil menghapus ${idsToDelete.length} transaksi`,
      deletedIds: idsToDelete
    })

  } catch (error: any) {
    console.error("Bulk Delete Error:", error)
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 })
  }
}