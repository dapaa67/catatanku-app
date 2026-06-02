/**
 * CatatanKu — Demo Data Seeder
 * Jalankan dengan: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 *
 * Script ini akan:
 * 1. Login ke Supabase untuk dapat User ID
 * 2. Membuat / memastikan Profile user ada
 * 3. Membuat 3 Dompet (Wallet)
 * 4. Membuat 35 Transaksi (2 bulan ke belakang)
 * 5. Membuat 3 Target Tabungan + Riwayat Setoran
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Konfigurasi ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://cpfjhlbaeqgdvocwurfl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZmpobGJhZXFnZHZvY3d1cmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzcwNjYsImV4cCI6MjA5NDAxMzA2Nn0.BSGZ9GCZ3O68kHIk2u10ASwiEngAdhzbi7WgZ4dl4as";
const DATABASE_URL =
  "postgresql://postgres.cpfjhlbaeqgdvocwurfl:123catatankU@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const DEMO_EMAIL = "tes@gmail.com";
const DEMO_PASSWORD = "12345678";
const DEMO_FULL_NAME = "Budi Santoso";

// ─── Inisialisasi Client ────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helper: tanggal relatif (hari ke belakang dari sekarang) ───────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0); // jam 10–18
  return d;
}

// ─── Main Seeder ────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 CatatanKu Seeder dimulai...\n");

  // 1. Login ke Supabase
  console.log(`🔑 Login sebagai ${DEMO_EMAIL}...`);
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

  if (authError || !authData.user) {
    throw new Error(`❌ Login gagal: ${authError?.message ?? "Unknown error"}`);
  }

  const userId = authData.user.id;
  console.log(`✅ Login berhasil! User ID: ${userId}\n`);

  // 2. Pastikan Profile ada
  console.log("👤 Memastikan Profile user ada...");
  await prisma.profile.upsert({
    where: { id: userId },
    update: { fullName: DEMO_FULL_NAME },
    create: {
      id: userId,
      email: DEMO_EMAIL,
      fullName: DEMO_FULL_NAME,
    },
  });
  console.log("✅ Profile OK\n");

  // 3. Hapus data lama (biar nggak dobel kalau dijalanin ulang)
  console.log("🗑️  Membersihkan data lama...");
  const existingWallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true },
  });
  const walletIds = existingWallets.map((w) => w.id);

  if (walletIds.length > 0) {
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId },
      select: { id: true },
    });
    const goalIds = savingsGoals.map((g) => g.id);
    if (goalIds.length > 0) {
      await prisma.savingsTransaction.deleteMany({ where: { goalId: { in: goalIds } } });
      await prisma.savingsGoal.deleteMany({ where: { userId } });
    }
    await prisma.transaction.deleteMany({ where: { walletId: { in: walletIds } } });
    await prisma.wallet.deleteMany({ where: { userId } });
  }
  console.log("✅ Data lama dihapus\n");

  // 4. Buat 3 Dompet
  console.log("💼 Membuat 3 Dompet...");
  const walletCash = await prisma.wallet.create({
    data: {
      userId,
      name: "Dompet Cash",
      color: "#10B981",
      balance: 0,
      initialBalance: 800000,
      isDefault: true,
    },
  });
  const walletBCA = await prisma.wallet.create({
    data: {
      userId,
      name: "Rekening BCA",
      color: "#3B82F6",
      balance: 0,
      initialBalance: 6500000,
    },
  });
  const walletGoPay = await prisma.wallet.create({
    data: {
      userId,
      name: "GoPay",
      color: "#06B6D4",
      balance: 0,
      initialBalance: 350000,
    },
  });
  console.log("✅ 3 Dompet berhasil dibuat\n");

  // 5. Data Transaksi
  console.log("💸 Membuat 35 Transaksi...");

  type TxData = {
    walletId: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    category: string;
    date: Date;
    note?: string;
  };

  const transactions: TxData[] = [
    // ── PEMASUKAN ──────────────────────────────────────────────
    { walletId: walletBCA.id, type: "INCOME", amount: 7000000, description: "Gaji Bulan April", category: "PEMASUKAN", date: daysAgo(62) },
    { walletId: walletBCA.id, type: "INCOME", amount: 1200000, description: "Freelance desain logo klien", category: "PEMASUKAN", date: daysAgo(53) },
    { walletId: walletGoPay.id, type: "INCOME", amount: 500000, description: "Transfer dari orang tua", category: "PEMASUKAN", date: daysAgo(48) },
    { walletId: walletBCA.id, type: "INCOME", amount: 7000000, description: "Gaji Bulan Mei", category: "PEMASUKAN", date: daysAgo(32) },
    { walletId: walletGoPay.id, type: "INCOME", amount: 50000, description: "Cashback reward GoPay Plus", category: "INVESTASI", date: daysAgo(28) },
    { walletId: walletBCA.id, type: "INCOME", amount: 350000, description: "Jual barang bekas di Tokopedia", category: "PEMASUKAN", date: daysAgo(13) },

    // ── MAKANAN ────────────────────────────────────────────────
    { walletId: walletCash.id, type: "EXPENSE", amount: 18000, description: "Makan siang warteg", category: "MAKANAN", date: daysAgo(60) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 28000, description: "Kopi Kenangan pagi hari", category: "MAKANAN", date: daysAgo(55) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 35000, description: "Makan malam Padang", category: "MAKANAN", date: daysAgo(50) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 45000, description: "Beli mi instan & cemilan", category: "MAKANAN", date: daysAgo(44) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 22000, description: "Ayam geprek + es teh", category: "MAKANAN", date: daysAgo(38) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 55000, description: "Beli buah dan sayur pasar", category: "MAKANAN", date: daysAgo(25) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 120000, description: "Pizza Hut di mall", category: "MAKANAN", date: daysAgo(15) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 15000, description: "Gorengan dan jajan sore", category: "MAKANAN", date: daysAgo(4) },

    // ── TRANSPORTASI ───────────────────────────────────────────
    { walletId: walletCash.id, type: "EXPENSE", amount: 70000, description: "Isi bensin motor Pertamax", category: "TRANSPORTASI", date: daysAgo(57) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 24000, description: "Gojek ke kampus", category: "TRANSPORTASI", date: daysAgo(42) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 32000, description: "Grab ke stasiun", category: "TRANSPORTASI", date: daysAgo(30) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 85000, description: "Tol Jakarta-Bandung", category: "TRANSPORTASI", date: daysAgo(20) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 20000, description: "Parkir motor di mall", category: "TRANSPORTASI", date: daysAgo(7) },

    // ── TAGIHAN ────────────────────────────────────────────────
    { walletId: walletBCA.id, type: "EXPENSE", amount: 800000, description: "Bayar kos bulan April", category: "TAGIHAN", date: daysAgo(61), note: "Kos Jalan Merdeka No.12" },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 800000, description: "Bayar kos bulan Mei", category: "TAGIHAN", date: daysAgo(31), note: "Kos Jalan Merdeka No.12" },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 150000, description: "Token listrik PLN", category: "TAGIHAN", date: daysAgo(22) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 85000, description: "Paket internet Indosat 30GB", category: "TAGIHAN", date: daysAgo(18) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 54990, description: "Langganan Spotify Premium", category: "TAGIHAN", date: daysAgo(10) },

    // ── BELANJA ────────────────────────────────────────────────
    { walletId: walletBCA.id, type: "EXPENSE", amount: 180000, description: "Beli kaos polos 3 pcs", category: "BELANJA", date: daysAgo(56) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 450000, description: "Sepatu olahraga Nike", category: "BELANJA", date: daysAgo(40) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 95000, description: "Peralatan mandi & toiletries", category: "BELANJA", date: daysAgo(33) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 35000, description: "Beli buku catatan kuliah", category: "BELANJA", date: daysAgo(19) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 210000, description: "Skincare rutin bulanan", category: "BELANJA", date: daysAgo(8) },

    // ── KESEHATAN ──────────────────────────────────────────────
    { walletId: walletBCA.id, type: "EXPENSE", amount: 75000, description: "Beli vitamin C & suplemen", category: "KESEHATAN", date: daysAgo(46) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 150000, description: "Konsultasi dokter umum klinik", category: "KESEHATAN", date: daysAgo(27) },
    { walletId: walletCash.id, type: "EXPENSE", amount: 48000, description: "Beli obat di apotek Kimia Farma", category: "KESEHATAN", date: daysAgo(12) },

    // ── HIBURAN ────────────────────────────────────────────────
    { walletId: walletBCA.id, type: "EXPENSE", amount: 100000, description: "Nonton bioskop Avengers (2 tiket)", category: "HIBURAN", date: daysAgo(35) },
    { walletId: walletGoPay.id, type: "EXPENSE", amount: 50000, description: "Top-up Mobile Legends Diamond", category: "HIBURAN", date: daysAgo(16) },
    { walletId: walletBCA.id, type: "EXPENSE", amount: 65000, description: "Langganan Netflix Standard", category: "HIBURAN", date: daysAgo(5) },
  ];

  // Insert transaksi satu per satu + update saldo dompet
  let txCount = 0;
  for (const tx of transactions) {
    await prisma.$transaction([
      prisma.transaction.create({ data: tx }),
      prisma.wallet.update({
        where: { id: tx.walletId },
        data: {
          balance: {
            [tx.type === "INCOME" ? "increment" : "decrement"]: tx.amount,
          },
        },
      }),
    ]);
    txCount++;
    process.stdout.write(`\r   📝 Transaksi ${txCount}/${transactions.length} dibuat...`);
  }

  // Tambahkan saldo awal ke balance
  await prisma.wallet.update({ where: { id: walletCash.id }, data: { balance: { increment: 800000 } } });
  await prisma.wallet.update({ where: { id: walletBCA.id }, data: { balance: { increment: 6500000 } } });
  await prisma.wallet.update({ where: { id: walletGoPay.id }, data: { balance: { increment: 350000 } } });

  console.log(`\n✅ ${txCount} Transaksi berhasil dibuat\n`);

  // 6. Buat 3 Target Tabungan
  console.log("🎯 Membuat 3 Target Tabungan...");

  // Goal 1: Headphone — hampir tercapai (64%)
  const goal1 = await prisma.savingsGoal.create({
    data: {
      userId,
      name: "Headphone Sony WH-1000XM5",
      targetAmount: 5000000,
      currentAmount: 0,
      planType: "BULANAN",
      planAmount: 400000,
      status: "BERLANGSUNG",
    },
  });

  const goal1Deposits = [
    { amount: 400000, note: "Setoran rutin bulan Maret", date: daysAgo(90) },
    { amount: 400000, note: "Setoran rutin bulan April", date: daysAgo(60) },
    { amount: 800000, note: "Bonus freelance, langsung ditabung!", date: daysAgo(45) },
    { amount: 400000, note: "Setoran rutin bulan Mei", date: daysAgo(30) },
    { amount: 600000, note: "Lebih dari target bulan ini", date: daysAgo(10) },
    { amount: 600000, note: "Sisa uang jajan pekan ini", date: daysAgo(3) },
  ];
  for (const dep of goal1Deposits) {
    await prisma.$transaction([
      prisma.savingsTransaction.create({ data: { goalId: goal1.id, userId, ...dep } }),
      prisma.savingsGoal.update({ where: { id: goal1.id }, data: { currentAmount: { increment: dep.amount } } }),
    ]);
  }

  // Goal 2: Liburan Bali — baru mulai (19%)
  const goal2 = await prisma.savingsGoal.create({
    data: {
      userId,
      name: "Liburan ke Bali",
      targetAmount: 8000000,
      currentAmount: 0,
      planType: "BULANAN",
      planAmount: 300000,
      status: "BERLANGSUNG",
    },
  });

  const goal2Deposits = [
    { amount: 300000, note: "Mulai nabung buat Bali!", date: daysAgo(65) },
    { amount: 300000, note: "Setoran bulan April", date: daysAgo(35) },
    { amount: 500000, note: "Dapat duit lebih, gas!", date: daysAgo(20) },
    { amount: 400000, note: "Setoran bulan Mei", date: daysAgo(5) },
  ];
  for (const dep of goal2Deposits) {
    await prisma.$transaction([
      prisma.savingsTransaction.create({ data: { goalId: goal2.id, userId, ...dep } }),
      prisma.savingsGoal.update({ where: { id: goal2.id }, data: { currentAmount: { increment: dep.amount } } }),
    ]);
  }

  // Goal 3: Laptop — TERCAPAI! ✅
  const goal3 = await prisma.savingsGoal.create({
    data: {
      userId,
      name: "Beli Laptop Baru (ASUS Vivobook)",
      targetAmount: 9000000,
      currentAmount: 0,
      planType: "BULANAN",
      planAmount: 1000000,
      status: "BERLANGSUNG",
    },
  });

  const goal3Deposits = [
    { amount: 1000000, note: "Setoran pertama, semangat!", date: daysAgo(150) },
    { amount: 1000000, note: "Setoran bulan ke-2", date: daysAgo(120) },
    { amount: 1000000, note: "Setoran bulan ke-3", date: daysAgo(90) },
    { amount: 1500000, note: "Dapat THR, langsung nabung!", date: daysAgo(75) },
    { amount: 1000000, note: "Setoran bulan ke-5", date: daysAgo(60) },
    { amount: 1000000, note: "Setoran bulan ke-6", date: daysAgo(30) },
    { amount: 1000000, note: "Setoran terakhir, hampir sampai!", date: daysAgo(15) },
    { amount: 1500000, note: "Selesai! Target tercapai 🎉", date: daysAgo(5) },
  ];
  for (const dep of goal3Deposits) {
    const newTotal = Number(goal3.currentAmount) + dep.amount;
    const isAchieved = newTotal >= Number(goal3.targetAmount);
    await prisma.$transaction([
      prisma.savingsTransaction.create({ data: { goalId: goal3.id, userId, ...dep } }),
      prisma.savingsGoal.update({
        where: { id: goal3.id },
        data: {
          currentAmount: { increment: dep.amount },
          status: isAchieved ? "TERCAPAI" : "BERLANGSUNG",
        },
      }),
    ]);
  }

  console.log("✅ 3 Target Tabungan beserta riwayat setoran berhasil dibuat\n");

  // Rangkuman final
  const finalWallets = await prisma.wallet.findMany({ where: { userId } });
  const totalBalance = finalWallets.reduce((sum, w) => sum + Number(w.balance), 0);

  console.log("══════════════════════════════════════════");
  console.log("🎉 SEEDER SELESAI! Ringkasan data:");
  console.log("══════════════════════════════════════════");
  finalWallets.forEach((w) => {
    console.log(`  💳 ${w.name}: Rp ${Number(w.balance).toLocaleString("id-ID")}`);
  });
  console.log(`  📊 Total Saldo: Rp ${totalBalance.toLocaleString("id-ID")}`);
  console.log(`  💸 Total Transaksi: ${transactions.length} transaksi`);
  console.log(`  🎯 Target Tabungan: 3 goal (1 TERCAPAI, 2 BERLANGSUNG)`);
  console.log("══════════════════════════════════════════\n");
  console.log("✅ Buka aplikasi sekarang dan lihat datanya sudah ada!");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
