import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

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

    // TODO (Backend): 
    // ====== AI ASSISTANT ======
    // 1. Ambil data keuangan user sebagai context untuk AI
    //    Misal: ambil total saldo dari semua wallet, ambil 10 transaksi terakhir, atau status tabungan.
    // 2. Olah data tersebut menjadi string/JSON context yang rapi.
    // 3. Gabungkan context keuangan tersebut dengan `message` dari user.
    // 4. Tembak endpoint FastAPI lo (misal: https://yobby15-catatanku-fastapi.hf.space/api/chat/ask) via POST.
    //    Kirim `session_id` dan pesan yang udah di-inject context.
    // 5. Tangkap `reply` dari FastAPI dan return ke frontend.

    /* CONTOH PENGAMBILAN DATA (Silakan modifikasi) :
    const wallets = await prisma.wallet.findMany({ where: { userId: user.id } });
    const transactions = await prisma.transaction.findMany({
      where: { wallet: { userId: user.id } },
      orderBy: { date: 'desc' },
      take: 10
    });
    */

    // HAPUS MOCK RESPONSE INI KALAU SUDAH DIINTEGRASI
    return NextResponse.json({
      reply: "Fitur AI Assistant sedang dalam tahap pengembangan backend oleh tim kami. Mohon ditunggu ya! 🚀"
    });

  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pesan: " + error.message },
      { status: 500 }
    );
  }
}
