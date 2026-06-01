"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Calendar } from "lucide-react";

interface TambahTabunganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TambahTabunganModal({ isOpen, onClose, onSuccess }: TambahTabunganModalProps) {
  const [view, setView] = useState<"main" | "calculator">("main");
  const [rencana, setRencana] = useState("Bulanan");

  const [name, setName] = useState("");
  const [rawTarget, setRawTarget] = useState("");
  const [displayTarget, setDisplayTarget] = useState("");
  const [rawPlan, setRawPlan] = useState("");
  const [displayPlan, setDisplayPlan] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showEstimasiModal, setShowEstimasiModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [estimasiData, setEstimasiData] = useState<{ target: number; plan: number; days: number; date: string } | null>(null);
  const [isEstimasiLoading, setIsEstimasiLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          setPhotoPreview(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawTarget(val);
    setDisplayTarget(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawPlan(val);
    setDisplayPlan(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
  };

  const fetchEstimasi = async () => {
    const target = Number(rawTarget) || 0;
    const plan = Number(rawPlan) || 0;
    if (plan <= 0 || target <= 0) {
      setErrorMsg("Isi target dan nominal pengisian dulu untuk melihat estimasi.");
      return;
    }
    
    setErrorMsg(null);
    setIsEstimasiLoading(true);
    
    try {
      // Untuk tabungan baru, estimasi dihitung secara manual karena belum ada histori
      const estimasiKaliNabung = Math.ceil(target / plan);
      
      // Simulasi delay kecil agar UI terasa alami
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let daysPerPlan = 1;
      if (rencana === "Mingguan") daysPerPlan = 7;
      if (rencana === "Bulanan") daysPerPlan = 30;

      const totalDaysNeeded = estimasiKaliNabung * daysPerPlan;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + totalDaysNeeded);

      setEstimasiData({
        target,
        plan,
        days: totalDaysNeeded,
        date: estimatedDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
      });
      setShowEstimasiModal(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan saat mengambil prediksi AI");
    } finally {
      setIsEstimasiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name || !rawTarget) {
      setErrorMsg("Nama dan Target Tabungan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      // Hitung deadline otomatis jika ada target dan plan
      let calculatedDeadline = null;
      if (estimasiData && estimasiData.days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + estimasiData.days);
        calculatedDeadline = d.toISOString();
      }

      const payload = {
        name,
        targetAmount: Number(rawTarget),
        planType: rencana.toUpperCase(),
        planAmount: rawPlan ? Number(rawPlan) : null,
        deadline: calculatedDeadline,
        photoUrl: photoPreview // kirim string base64 foto
      };

      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Gagal menyimpan tabungan");

      setName("");
      setRawTarget("");
      setDisplayTarget("");
      setRawPlan("");
      setDisplayPlan("");
      setDeadline("");
      setPhotoFile(null);
      setPhotoPreview(null);
      
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      setErrorMsg("Gagal menyimpan tabungan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-xl overflow-y-auto max-h-[90vh] relative">
        
        {view === "main" ? (
          <div className="flex flex-col animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Tambah Tabungan</h2>
            
            {/* Pesan Error */}
            {errorMsg && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6 animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}
            
            {/* Photo Upload Area */}
            <label className="border border-primary/40 rounded-3xl h-56 flex flex-col items-center justify-center gap-2 mb-6 cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden group">
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm">Ganti Foto</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-500">Pilih Foto Tabungan</span>
                </div>
              )}
            </label>

            {/* Rencana Pengisian */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-800 mb-3">Rencana Pengisian</label>
              <div className="flex gap-3">
                {["Harian", "Mingguan", "Bulanan"].map(item => (
                  <button 
                    key={item}
                    onClick={() => setRencana(item)}
                    className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${
                      rencana === item 
                        ? "border border-primary bg-white text-slate-800" 
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Nama Tabungan" 
                className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Target Tabungan (contoh: 10.000.000)" 
                className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800"
                value={displayTarget}
                onChange={handleTargetChange}
              />
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nominal Pengisian" 
                  className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800"
                  value={displayPlan}
                  onChange={handlePlanChange}
                />
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  onClick={fetchEstimasi}
                >
                   
                   {isEstimasiLoading ? (
                     <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <Calendar className="w-5 h-5 text-primary" />
                   )}
                </div>
              </div>
            </div>


            {/* Tombol Aksi */}
            <div className="flex justify-center gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-full text-slate-500 font-bold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>

            {/* Popup Perkiraan */}
            {showEstimasiModal && estimasiData && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 rounded-[2rem] animate-in fade-in duration-200">
                <div className="bg-white rounded-[2rem] p-6 w-[85%] shadow-2xl relative">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Estimasi</h3>
                  
                  <div className="flex flex-col gap-4 mb-8">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Target</p>
                      <p className="text-sm font-medium text-slate-500">{new Intl.NumberFormat("id-ID").format(estimasiData.target)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Rencana Pengisian</p>
                      <p className="text-sm font-medium text-slate-500">{new Intl.NumberFormat("id-ID").format(estimasiData.plan)} Per{rencana.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Estimasi Tercapai</p>
                      <p className="text-sm font-medium text-slate-500">{estimasiData.date} ({estimasiData.days} Hari)</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => setShowEstimasiModal(false)}
                      className="text-primary font-bold text-sm hover:text-primary/80 transition-colors px-4 py-2"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-200">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Kalkulator Target</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Nominal Target" 
                className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800"
              />
              <input 
                type="text" 
                placeholder="Tanggal Tercapai" 
                className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800"
              />
            </div>

            <button className="w-full sm:w-auto self-center px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md mb-8">
              Hitung Rencana Pengisian
            </button>

            {/* Hasil Perkiraan */}
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-500 mb-4">Target : 100.000.000 - 31 Oktober 2026 (183 Hari)</p>
              
              <div className="flex flex-col gap-3">
                {/* Harian */}
                <div 
                  className="border border-primary/40 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => { setRencana("Harian"); setView("main"); }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 mb-1">Harian</span>
                    <span className="text-xs font-bold text-slate-800">546.448 Selama 183 Hari</span>
                  </div>
                  <span className="text-xs font-bold text-primary/70">Pilih</span>
                </div>

                {/* Mingguan */}
                <div 
                  className="border border-primary/40 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => { setRencana("Mingguan"); setView("main"); }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 mb-1">Mingguan</span>
                    <span className="text-xs font-bold text-slate-800">3.846.153 Selama 26 Minggu</span>
                  </div>
                  <span className="text-xs font-bold text-primary/70">Pilih</span>
                </div>

                {/* Bulanan */}
                <div 
                  className="border border-primary/40 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => { setRencana("Bulanan"); setView("main"); }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 mb-1">Bulanan</span>
                    <span className="text-xs font-bold text-slate-800">16.666.666 Selama 6 Bulan</span>
                  </div>
                  <span className="text-xs font-bold text-primary/70">Pilih</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setView("main")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
