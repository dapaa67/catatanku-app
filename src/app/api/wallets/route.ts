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

  // Pastikan profile user ada (fallback jika trigger Supabase auth belum jalan/belum diset)
  const existingProfile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      }
    })
  }

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