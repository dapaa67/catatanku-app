import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "https://yobby15-catatanku-fastapi.hf.space";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { session_id, message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // 1. Ambil data keuangan user sebagai context
    const [wallets, recentTransactions, savingsGoals] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId: user.id },
        select: { name: true, balance: true }
      }),
      prisma.transaction.findMany({
        where: { wallet: { userId: user.id } },
        orderBy: { date: "desc" },
        take: 10,
        select: { type: true, amount: true, description: true, category: true, date: true }
      }),
      prisma.savingsGoal.findMany({
        where: { userId: user.id, status: "BERLANGSUNG" },
        select: { name: true, targetAmount: true, currentAmount: true }
      })
    ]);

    // 2. Olah jadi context string yang rapi
    const totalSaldo = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    const walletContext = wallets.map(w =>
      `- ${w.name}: Rp ${Number(w.balance).toLocaleString("id-ID")}`
    ).join("\n");

    const transactionContext = recentTransactions.map(t =>
      `- [${t.type}] ${t.description} | ${t.category} | Rp ${Number(t.amount).toLocaleString("id-ID")} | ${new Date(t.date).toLocaleDateString("id-ID")}`
    ).join("\n");

    const savingsContext = savingsGoals.map(g =>
      `- ${g.name}: terkumpul Rp ${Number(g.currentAmount).toLocaleString("id-ID")} dari target Rp ${Number(g.targetAmount).toLocaleString("id-ID")}`
    ).join("\n");

    const contextBlock = `
[DATA KEUANGAN USER - gunakan sebagai konteks untuk menjawab]
Total saldo semua dompet: Rp ${totalSaldo.toLocaleString("id-ID")}

Dompet:
${walletContext || "Tidak ada dompet"}

10 Transaksi terakhir:
${transactionContext || "Belum ada transaksi"}

Tabungan aktif:
${savingsContext || "Tidak ada tabungan aktif"}
[AKHIR DATA KEUANGAN]

Pertanyaan user: ${message}`.trim();

    // 3. Kirim ke FastAPI
    const aiRes = await fetch(`${FASTAPI_URL}/api/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: session_id ?? "default",
        message: contextBlock
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!aiRes.ok) {
      throw new Error(`FastAPI error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();

    return NextResponse.json({
      reply: aiData.reply ?? "Maaf, tidak ada respons dari AI."
    });

  } catch (error: unknown) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pesan" },
      { status: 500 }
    );
  }
}