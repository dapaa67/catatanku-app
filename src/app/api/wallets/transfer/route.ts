import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const body = await req.json();
  const { fromWalletId, toWalletId, amount } = body;

  if (!fromWalletId || !toWalletId || !amount) {
    return NextResponse.json({ error: "Data transfer tidak lengkap" }, { status: 400 });
  }

  if (fromWalletId === toWalletId) {
    return NextResponse.json({ error: "Dompet asal dan tujuan tidak boleh sama" }, { status: 400 });
  }

  const transferAmount = Number(amount);
  if (transferAmount <= 0) {
    return NextResponse.json({ error: "Jumlah transfer harus lebih besar dari 0" }, { status: 400 });
  }

  try {
    // Jalankan transaksi database (all-or-nothing)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek dompet asal
      const fromWallet = await tx.wallet.findFirst({
        where: { id: fromWalletId, userId: user.id }
      });
      if (!fromWallet) throw new Error("Dompet asal tidak ditemukan");
      if (Number(fromWallet.balance) < transferAmount) throw new Error("Saldo tidak mencukupi");

      // 2. Cek dompet tujuan
      const toWallet = await tx.wallet.findFirst({
        where: { id: toWalletId, userId: user.id }
      });
      if (!toWallet) throw new Error("Dompet tujuan tidak ditemukan");

      // 3. Kurangi saldo asal
      const updatedFrom = await tx.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: transferAmount } }
      });

      // 4. Tambah saldo tujuan
      const updatedTo = await tx.wallet.update({
        where: { id: toWalletId },
        data: { balance: { increment: transferAmount } }
      });

      // Opsional: Catat transaksi ini di tabel Transaction sebagai histori transfer
      // Karena belum ada enum untuk transfer, kita catat sebagai Expense di asal dan Income di tujuan, atau abaikan saja dulu
      
      return { updatedFrom, updatedTo };
    });

    return NextResponse.json({ message: "Transfer berhasil", data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan saat transfer" }, { status: 400 });
  }
}
