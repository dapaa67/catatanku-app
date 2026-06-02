"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

interface EditDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  goalId: string;
  txId: string;
  initialData: {
    amount: number;
    note: string;
  };
}

export default function EditDepositModal({
  isOpen,
  onClose,
  onSuccess,
  goalId,
  txId,
  initialData,
}: EditDepositModalProps) {
  const [rawAmount, setRawAmount] = useState<string>(Math.abs(initialData.amount).toString());
  const [displayAmount, setDisplayAmount] = useState<string>(
    new Intl.NumberFormat("id-ID").format(Math.abs(initialData.amount))
  );
  const [note, setNote] = useState<string>(initialData.note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Deteksi apakah ini transaksi negatif (koreksi)
  const isNegative = initialData.amount < 0;

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSubmit = async () => {
    let numAmount = Number(rawAmount);
    if (!numAmount) {
      setError("Nominal tidak boleh 0 atau kosong");
      return;
    }
    
    // Kembalikan ke minus kalau asalnya minus
    if (isNegative) numAmount = -Math.abs(numAmount);

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/savings/${goalId}/deposit/${txId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          note: note,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan perubahan");

      if (onSuccess) onSuccess();
      handleClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/savings/${goalId}/deposit/${txId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus riwayat");

      if (onSuccess) onSuccess();
      handleClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Jika sedang mode konfirmasi hapus
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-xl relative animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-8 h-8" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">Hapus Riwayat?</h3>
          <p className="text-slate-500 text-center text-sm mb-8 font-medium leading-relaxed">
            Riwayat <span className="font-bold text-slate-700">"{initialData.note || 'Pengisian Tabungan'}"</span> akan dihapus permanen. Total tabungan kamu akan disesuaikan otomatis.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={executeDelete}
              disabled={isDeleting}
              className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus!"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Riwayat</h2>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || isSubmitting}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Nominal Setoran</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {isNegative ? "-Rp" : "Rp"}
              </span>
              <input 
                type="text" 
                className="w-full border border-primary/40 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 bg-slate-50 focus:bg-white transition-colors"
                value={displayAmount}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setRawAmount(val);
                  setDisplayAmount(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Catatan</label>
            <input 
              type="text" 
              className="w-full border border-primary/40 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 bg-slate-50 focus:bg-white transition-colors"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Setoran dari bonus bulanan"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 pb-7 pt-2">
          <button 
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            className="flex-1 py-3 rounded-full text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || isDeleting}
            className="flex-1 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

      </div>
    </div>
  );
}
