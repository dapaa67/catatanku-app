"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthLeftPanel from "@/app/auth/_components/AuthLeftPanel";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Kata sandi dan konfirmasi tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        setError(authError.message ?? "Gagal mendaftar. Silakan coba lagi.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Panel Kiri */}
      <AuthLeftPanel />

      {/* Panel Kanan — form tepat di tengah */}
      <div className="flex-1 flex flex-col items-center bg-slate-50 px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[400px] my-auto flex-shrink-0">

          {/* Logo Mobile */}
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="bg-primary p-3 rounded-2xl shadow-sm">
              <NotebookPen className="text-white w-7 h-7" />
            </div>
            <span className="text-primary text-2xl font-bold italic tracking-wide">CatatanKu</span>
          </div>

          {/* Tampilan Berhasil */}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Cek email kamu untuk verifikasi akun, lalu masuk ke CatatanKu.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          ) : (
            <>
              {/* Judul */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1.5">Daftar</h1>
                <p className="text-slate-500 text-sm">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                    Masuk sekarang
                  </Link>
                </p>
              </div>

              {/* Banner Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
                  ⚠️ {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-5">
                {/* Nama Lengkap */}
                <div>
                  <label htmlFor="register-name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Joko Anwar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="register-email" className="block text-sm font-semibold text-slate-700 mb-2">
                    E-mail
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                {/* Kata Sandi */}
                <div>
                  <label htmlFor="register-password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi */}
                <div>
                  <label htmlFor="register-confirm" className="block text-sm font-semibold text-slate-700 mb-2">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && confirmPassword !== password
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-200 focus:ring-primary/40"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1.5">Kata sandi tidak cocok.</p>
                  )}
                </div>

                {/* Tombol Daftar */}
                <button
                  id="btn-register"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Mendaftar...
                    </span>
                  ) : "Daftar"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
