"use client";

import { useState, useEffect } from "react";
import { User, Mail, Save, Loader2 } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PengaturanPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userEmail = user.email || "";
          const userName = user.user_metadata?.name || userEmail.split("@")[0] || "";
          setEmail(userEmail);
          setName(userName);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama tidak boleh kosong" });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      
      // Refresh to ensure updates flow to other components
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (e: any) {
      console.error(e);
      setMessage({ type: "error", text: e.message || "Gagal memperbarui profil" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl pb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-slate-800">Pengaturan</h1>
          <p className="text-sm font-medium text-slate-500">Kelola informasi akun kamu</p>
        </div>
        <div className="bg-white border border-primary/20 rounded-3xl p-8 shadow-sm animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 text-slate-800">Pengaturan</h1>
        <p className="text-sm font-medium text-slate-500">Kelola informasi akun kamu</p>
      </div>

      {/* Profil Section */}
      <div className="bg-white border border-primary/20 rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Profil Saya
        </h2>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-6 ${message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Email Input (Readonly) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-500 cursor-not-allowed focus:outline-none"
              />
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2">Email tidak dapat diubah, digunakan untuk login.</p>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Tampilan</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama kamu"
                className="w-full bg-slate-50 border border-primary/40 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
              />
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2">Nama ini akan ditampilkan di Sidebar dan Dashboard.</p>
          </div>

          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
