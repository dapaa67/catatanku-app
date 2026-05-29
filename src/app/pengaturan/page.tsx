"use client";

import { useState, useEffect } from "react";
import { User, Mail, Save, Loader2, Lock, Eye, EyeOff, AlertTriangle, ShieldAlert } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PasswordInput = ({
  label, value, onChange, show, onToggle, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"}
        className="w-full bg-slate-50 border border-primary/30 rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default function PengaturanPage() {
  const router = useRouter();

  // --- Profil State ---
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- Hapus Akun State ---
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || "");
          setName(user.user_metadata?.name || user.email?.split("@")[0] || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── Handler: Simpan Profil ──
  const handleSaveProfil = async () => {
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Nama tidak boleh kosong" });
      return;
    }
    setIsSaving(true);
    setProfileMsg(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
      if (error) throw error;
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setProfileMsg({ type: "error", text: e.message || "Gagal memperbarui profil" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handler: Ganti Password ──
  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: "Semua field password wajib diisi" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password baru minimal 8 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }

    setIsChangingPw(true);
    try {
      const supabase = createBrowserClient();
      
      // Verifikasi password lama
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error("Password lama yang Anda masukkan salah.");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setPasswordMsg({ type: "success", text: "Password berhasil diperbarui!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordMsg({ type: "error", text: e.message || "Gagal memperbarui password" });
    } finally {
      setIsChangingPw(false);
    }
  };

  // ── Handler: Hapus Akun ──
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "HAPUS AKUN") return;
    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus akun");
      }
      // Logout & redirect
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (e: any) {
      alert(e.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl pb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-slate-800">Pengaturan</h1>
          <p className="text-sm font-medium text-slate-500">Kelola informasi akun kamu</p>
        </div>
        <div className="bg-white border border-primary/20 rounded-3xl p-8 shadow-sm animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="w-full pb-12 pr-4 lg:pr-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 font-medium">Kelola preferensi dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Kolom Kiri: Navigasi / Info Singkat */}
        <div className="lg:col-span-1 flex flex-col gap-4 sticky top-6 self-start">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-3xl border border-primary/10">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl mb-4 shadow-sm">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{name || "Pengguna"}</h3>
            <p className="text-sm text-slate-500 font-medium">{email}</p>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hidden lg:block">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Pengaturan</h4>
            <ul className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              <li 
                onClick={() => document.getElementById("profil-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="py-2 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <User className="w-4 h-4"/> Profil Saya
              </li>
              <li 
                onClick={() => document.getElementById("keamanan-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="py-2 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4"/> Keamanan
              </li>
              <li 
                onClick={() => document.getElementById("zona-bahaya-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="py-2 hover:text-red-500 flex items-center gap-2 text-slate-500 mt-2 border-t border-slate-200 pt-3 cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-4 h-4"/> Zona Bahaya
              </li>
            </ul>
          </div>
        </div>

        {/* Kolom Kanan: Form Pengaturan */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          
          {/* ── SECTION 1: Profil ── */}
          <div id="profil-section" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-primary" /> Profil Saya
            </h2>

            {profileMsg && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-6 ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Tampilan</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Masukkan nama kamu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1.5">Nama ini akan ditampilkan di Sidebar dan Dashboard.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1.5">Email tidak dapat diubah (digunakan untuk login).</p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleSaveProfil}
                disabled={isSaving || !name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </div>

          {/* ── SECTION 2: Keamanan ── */}
          <div id="keamanan-section" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="w-5 h-5 text-primary" /> Keamanan Akun
            </h2>

            {passwordMsg && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-6 ${passwordMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {passwordMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <PasswordInput
                  label="Password Lama"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  onToggle={() => setShowCurrent(!showCurrent)}
                  placeholder="Masukkan password saat ini"
                />
              </div>
              <div className="md:col-span-2">
                <PasswordInput
                  label="Password Baru"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggle={() => setShowNew(!showNew)}
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div className="md:col-span-2">
                <PasswordInput
                  label="Konfirmasi Password Baru"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleChangePassword}
                disabled={isChangingPw || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isChangingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isChangingPw ? "Memperbarui..." : "Perbarui Password"}
              </button>
            </div>
          </div>

          {/* ── SECTION 3: Zona Bahaya ── */}
          <div id="zona-bahaya-section" className="bg-white border border-red-100 rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-6">
            <h2 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Zona Bahaya
            </h2>
            <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-red-50">
              Tindakan di area ini bersifat <span className="font-bold text-red-500">permanen dan tidak dapat dibatalkan</span>.
            </p>

            {!showDeleteSection ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Hapus Akun Permanen</h4>
                  <p className="text-xs text-slate-500 mt-1">Semua data keuangan Anda akan dihapus.</p>
                </div>
                <button
                  onClick={() => setShowDeleteSection(true)}
                  className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-full font-bold transition-all text-sm cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" /> Hapus Akun
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 mb-1">Konfirmasi Hapus Akun</p>
                    <p className="text-xs text-red-600 leading-relaxed">
                      Semua data termasuk transaksi, dompet, dan tabungan akan dihapus secara permanen. Aksi ini <strong>tidak bisa dipulihkan</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    Ketik <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-700">HAPUS AKUN</span> di bawah ini:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="HAPUS AKUN"
                    className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowDeleteSection(false); setDeleteConfirmText(""); }}
                    className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "HAPUS AKUN" || isDeletingAccount}
                    className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isDeletingAccount ? "Menghapus..." : "Hapus Selamanya"}
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
