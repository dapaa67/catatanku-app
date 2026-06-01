"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, NotebookPen, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthLeftPanel from "@/app/auth/_components/AuthLeftPanel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) throw resetError;

      setIsSent(true);
    } catch (e: any) {
      setError(e.message || "Gagal mengirim email. Coba lagi.");
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

          {isSent ? (
            // Tampilan konfirmasi setelah email berhasil dikirim
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Email Terkirim!</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-2">
                Kami telah mengirim link reset kata sandi ke
              </p>
              <p className="text-primary font-semibold text-sm mb-6">{email}</p>
              <p className="text-slate-400 text-xs mb-8 leading-relaxed">
                Cek folder <strong>Inbox</strong> atau <strong>Spam</strong> kamu. Link berlaku selama <strong>1 jam</strong>.
              </p>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Masuk
              </Link>
              <button
                onClick={() => { setIsSent(false); setEmail(""); }}
                className="mt-4 w-full text-sm text-slate-400 hover:text-primary font-medium transition-colors"
              >
                Kirim ulang email
              </button>
            </div>
          ) : (
            // Form utama untuk memasukkan email reset
            <>
              {/* Tombol Kembali */}
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-primary transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Masuk
              </Link>

              {/* Judul */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1.5">Lupa Kata Sandi?</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Masukkan email akun kamu dan kami akan kirimkan link untuk membuat kata sandi baru.
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
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Alamat E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>

                <button
                  id="btn-forgot-submit"
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : "Kirim Link Reset"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
