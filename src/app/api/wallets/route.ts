import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  })
  return NextResponse.json({ data: wallets, message: "Berhasil mengambil data dompet" })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const body = await req.json()
  const { name, color, initialBalance } = body

  if (!name) return NextResponse.json({ error: "Nama dompet tidak boleh kosong" }, { status: 400 })

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      name,
      color: color ?? "#1D9E75",
      balance: initialBalance ?? 0,
      initialBalance: initialBalance ?? 0,
    }
  })
  return NextResponse.json({ data: wallet, message: "Dompet berhasil dibuat" }, { status: 201 })
}