"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, NotebookPen, Loader2, CheckCircle2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthLeftPanel from "@/app/auth/_components/AuthLeftPanel";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase menghandle token dari URL hash secara otomatis via onAuthStateChange
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    // Timeout fallback: jika tidak ada event dalam 3 detik, sesi tidak valid
    const timeout = setTimeout(() => {
      setIsValidSession((prev) => prev === null ? false : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setIsDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (e: any) {
      setError(e.message || "Gagal memperbarui kata sandi. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Panel Kiri */}
      <AuthLeftPanel />

      {/* Panel Kanan */}
      <div className="flex-1 flex flex-col items-center bg-slate-50 px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[400px] my-auto flex-shrink-0">

          {/* Logo Mobile */}
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="bg-primary p-3 rounded-2xl shadow-sm">
              <NotebookPen className="text-white w-7 h-7" />
            </div>
            <span className="text-primary text-2xl font-bold italic tracking-wide">CatatanKu</span>
          </div>

          {isDone ? (
            // Tampilan setelah password berhasil diperbarui
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Kata Sandi Diperbarui!</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Kata sandi kamu berhasil diubah. Kamu akan diarahkan ke halaman masuk dalam beberapa detik...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>

          ) : isValidSession === false ? (
            // Tampilan jika link sudah kadaluarsa atau tidak valid
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Tidak Valid</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Link reset kata sandi ini sudah kadaluarsa atau tidak valid. Silakan minta link baru.
              </p>
              <button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                Minta Link Baru
              </button>
            </div>

          ) : isValidSession === null ? (
            // Tampilan loading saat memvalidasi token dari email
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-slate-500 text-sm">Memvalidasi link...</p>
            </div>

          ) : (
            // Form utama untuk mengisi password baru
            <>
              {/* Judul */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1.5">Buat Kata Sandi Baru</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Masukkan kata sandi baru untuk akun CatatanKu kamu.
                </p>
              </div>

              {/* Banner Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
                  ⚠️ {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Password Baru */}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-12 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full bg-white border rounded-xl pl-12 pr-12 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-200 focus:ring-primary/40"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1.5">Kata sandi tidak cocok.</p>
                  )}
                </div>

                <button
                  id="btn-update-password"
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memperbarui...
                    </>
                  ) : "Simpan Kata Sandi Baru"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
