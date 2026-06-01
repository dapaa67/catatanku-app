import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    // Ambil user yang sedang login via session
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Hapus semua data user dari Prisma (urutan: child dulu, baru parent)
    // Hapus SavingsTransaction (relasi dari SavingsGoal dan Profile)
    await prisma.savingsTransaction.deleteMany({ where: { userId } });

    // Hapus SavingsGoal
    await prisma.savingsGoal.deleteMany({ where: { userId } });

    // Hapus AiTrainingData (tidak ada relasi ke user, skip jika tidak relevan)
    // Hapus Transaction (via Wallet cascade — tapi aman kalau explicit)
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    for (const w of wallets) {
      await prisma.transaction.deleteMany({ where: { walletId: w.id } });
    }

    // Hapus Wallet
    await prisma.wallet.deleteMany({ where: { userId } });

    // Hapus Profile
    await prisma.profile.delete({ where: { id: userId } });

    // Hapus user dari Supabase Auth (perlu SUPABASE_SERVICE_ROLE_KEY)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY belum diset, skip delete dari Supabase Auth");
    } else {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("Gagal hapus dari Supabase Auth:", deleteError.message);
      }
    }

    return NextResponse.json({ message: "Akun berhasil dihapus" }, { status: 200 });

  } catch (err: any) {
    console.error("Error saat hapus user:", err);
    return NextResponse.json({ error: err.message || "Gagal menghapus akun" }, { status: 500 });
  }
}
