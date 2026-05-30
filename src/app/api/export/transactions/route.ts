import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: { id: true }
  })
  const walletIds = wallets.map(w => w.id)

  const transactions = await prisma.transaction.findMany({
    where: { walletId: { in: walletIds } },
    orderBy: { date: "desc" },
    include: { wallet: { select: { name: true } } }
  })

  const headers = [
    "id", "wallet_name", "type", "amount", "description",
    "category", "date", "note", "photo_url", "created_at"
  ]

  const rows = transactions.map(t => [
    t.id,
    t.wallet.name,
    t.type,
    t.amount.toString(),
    `"${t.description.replace(/"/g, '""')}"`,
    t.category,
    t.date.toISOString(),
    t.note ? `"${t.note.replace(/"/g, '""')}"` : "",
    t.photoUrl ?? "",
    t.createdAt.toISOString()
  ].join(","))

  const csv = [headers.join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions_${Date.now()}.csv"`
    }
  })
}