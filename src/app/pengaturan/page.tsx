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

  // Variabel profil
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Variabel password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Handler untuk menyimpan perubahan profil
  const handleSaveProfil = async () => {
    if (!name.trim() || name.trim().length < 3) {
      setProfileMsg({ type: "error", text: "Nama lengkap harus memiliki minimal 3 karakter." });
      return;
    }

    // Validasi nama hanya boleh huruf, spasi, tanda hubung, atau petik tunggal
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
      setProfileMsg({ type: "error", text: "Nama hanya boleh berisi huruf dan spasi (karakter khusus tidak diizinkan)." });
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

  // Handler untuk mengubah password akun
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
    <div className="w-full pb-12 px-4 lg:pl-0 lg:pr-8">
      {/* Bagian Atas */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-slate-800">Pengaturan</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">Kelola preferensi dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* Kolom Kiri: Navigasi Profil */}
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
            </ul>
          </div>
        </div>

        {/* Kolom Kanan: Form */}
        <div className="lg:col-span-3 flex flex-col gap-6 md:gap-8">
          
          {/* Form profil pengguna */}
          <div id="profil-section" className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm scroll-mt-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
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

          {/* Form keamanan akun */}
          <div id="keamanan-section" className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm scroll-mt-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
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

        </div>
      </div>
    </div>
  );
}
