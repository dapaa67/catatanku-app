import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

async function getOwnedTransaction(id: string, userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true }
  });
  const walletIds = wallets.map(w => w.id);
  return prisma.transaction.findFirst({
    where: { id, walletId: { in: walletIds } },
    include: { wallet: true }
  });
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  const { id } = await params;
  const tx = await getOwnedTransaction(id, user.id);
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({
    data: tx,
    message: "Berhasil mengambil detail transaksi"
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  
  const { id } = await params;
  const oldTx = await getOwnedTransaction(id, user.id);
  if (!oldTx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  try {
    const body = await req.json();
    const walletId = body.walletId || oldTx.walletId;
    const type = body.type || oldTx.type;
    const amount = body.amount !== undefined ? Number(body.amount) : oldTx.amount;
    const description = body.description || oldTx.description;
    const category = body.category || oldTx.category;
    const date = body.date ? new Date(body.date) : oldTx.date;
    const note = body.note !== undefined ? body.note : oldTx.note;

    // Periksa validitas dompet baru (jika berubah)
    if (oldTx.walletId !== walletId) {
      const newWallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId: user.id }
      });
      if (!newWallet) return NextResponse.json({ error: "Dompet tujuan tidak valid" }, { status: 400 });

      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { [oldTx.type === 'INCOME' ? 'decrement' : 'increment']: oldTx.amount } }
        }),
        prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { [type === 'INCOME' ? 'increment' : 'decrement']: amount } }
        }),
        prisma.transaction.update({
          where: { id },
          data: { walletId, type, amount, description, category, date, note }
        })
      ]);
    } else {
      let balanceChange = 0;
      if (oldTx.type === 'INCOME') balanceChange -= Number(oldTx.amount);
      else balanceChange += Number(oldTx.amount);

      if (type === 'INCOME') balanceChange += Number(amount);
      else balanceChange -= Number(amount);

      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { increment: balanceChange } }
        }),
        prisma.transaction.update({
          where: { id },
          data: { walletId, type, amount, description, category, date, note }
        })
      ]);
    }

    return NextResponse.json({ message: "Transaksi berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update transaksi:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  const { id } = await params;
  const tx = await getOwnedTransaction(id, user.id);
  if (!tx) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.wallet.update({
      where: { id: tx.walletId },
      data: {
        balance: {
          [tx.type === "INCOME" ? "decrement" : "increment"]: tx.amount
        }
      }
    })
  ]);
  return NextResponse.json({ message: "Transaksi berhasil dihapus" });
}