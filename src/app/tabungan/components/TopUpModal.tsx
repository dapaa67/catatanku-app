"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  goalId: string;
  defaultAmount?: number;
}

export default function TopUpModal({ isOpen, onClose, onSuccess, goalId, defaultAmount }: TopUpModalProps) {
  const [rawAmount, setRawAmount] = useState<string>(defaultAmount ? defaultAmount.toString() : "");
  const [displayAmount, setDisplayAmount] = useState<string>(defaultAmount ? new Intl.NumberFormat("id-ID").format(defaultAmount) : "");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const numAmount = Number(rawAmount);
    if (!numAmount) {
      setError("Nominal tidak boleh 0 atau kosong");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/savings/${goalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          note: note || "Setor Tabungan",
          date: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan deposit");

      setRawAmount("");
      setDisplayAmount("");
      setNote("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Isi Tabungan</h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Nominal</label>
            <input 
              type="text" 
              placeholder="Contoh: 100.000" 
              className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 bg-slate-50 focus:bg-white transition-colors"
              value={displayAmount}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                setRawAmount(val);
                setDisplayAmount(val ? new Intl.NumberFormat("id-ID").format(Number(val)) : "");
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Catatan (Opsional)</label>
            <input 
              type="text" 
              placeholder="Contoh: Nabung uang jajan" 
              className="w-full border border-primary/40 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 bg-slate-50 focus:bg-white transition-colors"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

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
            className="px-10 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
