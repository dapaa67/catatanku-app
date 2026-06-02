"use client";

import React, { useState, useRef } from "react";
import { Loader2, CheckCircle, ImagePlus, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  goalId: string;
  initialData: {
    name: string;
    targetAmount: number;
    planType: string | null;
    planAmount: number | null;
    photoUrl: string | null;
  };
}

const PLAN_TYPES = ["HARIAN", "MINGGUAN", "BULANAN"];

export default function EditGoalModal({
  isOpen,
  onClose,
  onSuccess,
  goalId,
  initialData,
}: EditGoalModalProps) {
  const [name, setName] = useState(initialData.name);
  const [rawTarget, setRawTarget] = useState(initialData.targetAmount.toString());
  const [displayTarget, setDisplayTarget] = useState(
    new Intl.NumberFormat("id-ID").format(initialData.targetAmount)
  );
  const [planType, setPlanType] = useState(initialData.planType ?? "BULANAN");
  const [rawPlan, setRawPlan] = useState(initialData.planAmount?.toString() ?? "");
  const [displayPlan, setDisplayPlan] = useState(
    initialData.planAmount
      ? new Intl.NumberFormat("id-ID").format(initialData.planAmount)
      : ""
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData.photoUrl);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.photoUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [estimasiResult, setEstimasiResult] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    setIsDone(false);
    setEstimasiResult(null);
    onClose();
  };

  // Kompres dan ubah foto jadi base64 (tanpa Supabase Storage)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      
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
          
          const base64String = canvas.toDataURL("image/jpeg", 0.7);
          setPhotoPreview(base64String);
          setPhotoUrl(base64String);
          setIsUploadingPhoto(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Nama goal tidak boleh kosong.");
      return;
    }
    if (!rawTarget || Number(rawTarget) <= 0) {
      setError("Target nominal harus lebih dari 0.");
      return;
    }
    if (isUploadingPhoto) {
      setError("Tunggu foto selesai diupload.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/savings/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: Number(rawTarget),
          planType: planType || null,
          planAmount: rawPlan ? Number(rawPlan) : null,
          photoUrl: photoUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan perubahan");

      const estimasi = json.data?.estimasiKaliNabung;
      const targetChanged = Number(rawTarget) !== initialData.targetAmount;
      const planChanged = Number(rawPlan) !== (initialData.planAmount ?? 0);

      if (onSuccess) onSuccess();

      if ((targetChanged || planChanged) && estimasi !== null && estimasi !== undefined && estimasi > 0) {
        setEstimasiResult(estimasi);
        setIsDone(true);
      } else {
        handleClose();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tampilan sukses dengan estimasi AI
  if (isDone && estimasiResult !== null) {
    const unitLabel = planType === "HARIAN" ? "hari" : planType === "MINGGUAN" ? "minggu" : "bulan";
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-xl animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="w-20 h-20 text-primary mb-5" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tabungan Diperbarui!</h2>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed mt-4">
              Berdasarkan target baru dan pola nabung kamu, dibutuhkan sekitar{" "}
              <span className="font-bold text-primary">{estimasiResult} {unitLabel} lagi</span>{" "}
              untuk mencapai target. Semangat terus!
            </p>
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md text-lg"
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Tabungan</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="px-8 py-6 overflow-y-auto max-h-[65dvh] flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Foto Goal */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Foto Goal <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center group hover:border-primary/50 transition-colors">
              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Preview foto goal"
                    className="w-full h-full object-cover"
                  />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}
                  {!isUploadingPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-xs font-medium">Klik untuk upload foto</span>
                </button>
              )}
            </div>
            {photoPreview && !isUploadingPhoto && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-primary font-semibold hover:underline"
              >
                Ganti foto
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Nama Goal */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Goal</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beli Laptop Gaming"
              className="w-full border border-primary/30 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          {/* Target Nominal */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Target Nominal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
              <input
                type="text"
                value={displayTarget}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setRawTarget(val);
                  setDisplayTarget(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
                }}
                placeholder="5.000.000"
                className="w-full border border-primary/30 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Rencana Nabung */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Rencana Nabung</label>
            <div className="flex gap-2">
              {PLAN_TYPES.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPlanType(pt)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    planType === pt
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Nominal per Periode */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nominal per {planType === "HARIAN" ? "Hari" : planType === "MINGGUAN" ? "Minggu" : "Bulan"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
              <input
                type="text"
                value={displayPlan}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setRawPlan(val);
                  setDisplayPlan(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
                }}
                placeholder="300.000"
                className="w-full border border-primary/30 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-8 pb-7 pt-4 border-t border-slate-100">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-full text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingPhoto}
            className="flex-1 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
