"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TopUpModal from "../components/TopUpModal";

interface ApiSavingTransaction {
  id: string;
  amount: string | number;
  note: string | null;
  date: string;
}

interface ApiSavingGoalDetail {
  id: string;
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
  deadline?: string | null;
  planType?: string | null;
  planAmount?: string | null;
  photoUrl?: string | null;
  progressPercent: number;
  remainingAmount: number;
  createdAt: string;
  savingsTransactions: ApiSavingTransaction[];
}

export default function TabunganDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [goal, setGoal] = useState<ApiSavingGoalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchDetail = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/savings/${id}`);
      if (res.ok) {
        const json = await res.json();
        setGoal(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail(false);
  }, [fetchDetail, id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/tabungan");
      } else {
        alert("Gagal menghapus tabungan");
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus tabungan");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat detail tabungan...</div>;
  }

  if (!goal) {
    return <div className="p-8 text-center text-red-500">Tabungan tidak ditemukan.</div>;
  }

  const isAchieved = Number(goal.currentAmount) >= Number(goal.targetAmount);
  const kekuranganDisplay = isAchieved ? 0 : goal.remainingAmount;
  const progressCapped = Math.min(100, goal.progressPercent);

  let dynamicDaysLeft = 0;
  let dynamicDeadlineStr = goal.deadline;
  let dynamicTimesLeft = 0;
  let planUnit = "hari";

  if (!isAchieved && goal.deadline) {
    const timeDiff = new Date(goal.deadline).getTime() - new Date().getTime();
    dynamicDaysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (dynamicDaysLeft < 0) dynamicDaysLeft = 0;

    let daysPerPlan = 1;
    if (goal.planType === "MINGGUAN") {
      daysPerPlan = 7;
      planUnit = "minggu";
    } else if (goal.planType === "BULANAN") {
      daysPerPlan = 30;
      planUnit = "bulan";
    }
    dynamicTimesLeft = Math.ceil(dynamicDaysLeft / daysPerPlan);
  }

  return (
    <div className="flex flex-col w-full pb-20 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/tabungan" className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex-1 text-center pr-9">{goal.name}</h1>
        </div>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
          title="Hapus Tabungan"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Info Card */}
      <div className="bg-white border border-primary/30 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 mb-6">
        {/* Photo */}
        <div className="w-full md:w-64 h-48 md:h-auto rounded-2xl border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
          {goal.photoUrl ? (
            <img src={goal.photoUrl} alt={goal.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-slate-800 text-sm">foto</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col flex-1 justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-bold text-slate-700">Target</span>
            <span className="text-xs font-bold bg-green-100 text-green-600 px-4 py-1.5 rounded-full">
              {goal.planType ? `${goal.planType} - ${formatRupiah(Number(goal.planAmount))}` : 'Belum diatur'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-6">{formatRupiah(Number(goal.targetAmount))}</h2>

          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-500">Terkumpul</span>
            <span className="text-sm font-bold text-slate-800">{goal.progressPercent}% - {formatRupiah(Number(goal.currentAmount))}</span>
          </div>
          
          <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-primary/80 rounded-full transition-all duration-500" style={{ width: `${progressCapped}%` }}></div>
          </div>

          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] md:text-xs font-medium text-slate-500">Dibuat</span>
              <span className="text-xs md:text-sm font-bold text-slate-800 truncate">{new Date(goal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex flex-col items-center min-w-0 flex-1">
              <span className="text-[10px] md:text-xs font-bold text-primary flex items-center gap-1 mb-0.5">
                Prediksi
              </span>
              {isAchieved ? (
                <span className="text-xs md:text-sm font-bold text-green-500">Tercapai 🎉</span>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs md:text-sm font-bold text-slate-800 truncate w-full">{dynamicDeadlineStr ? new Date(dynamicDeadlineStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                  <span className="text-[9px] md:text-xs text-slate-500 mt-0.5">{dynamicTimesLeft > 0 ? `${dynamicTimesLeft}x nabung lagi` : ''}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end min-w-0 flex-1">
              <span className="text-[10px] md:text-xs font-medium text-slate-500">Kekurangan</span>
              <span className="text-xs md:text-sm font-bold text-red-500 truncate">{formatRupiah(kekuranganDisplay)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
        <div className="bg-white border border-primary/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs md:text-sm font-bold text-slate-800 mb-1 md:mb-2">Total Terkumpul</span>
          <h2 className="text-lg md:text-2xl font-bold text-green-500 truncate w-full px-2">{formatRupiah(Number(goal.currentAmount))}</h2>
        </div>
        <div className="bg-white border border-primary/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs md:text-sm font-bold text-slate-800 mb-1 md:mb-2">Kekurangan</span>
          <h2 className="text-lg md:text-2xl font-bold text-red-500 truncate w-full px-2">{formatRupiah(kekuranganDisplay)}</h2>
        </div>
        <div className="col-span-2 md:col-span-1 bg-white border border-primary/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full pointer-events-none"></div>
          <span className="text-xs md:text-sm font-bold text-slate-800 mb-1 md:mb-2 flex items-center gap-1.5 relative z-10">
            Estimasi
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 relative z-10 text-center">
            {isAchieved ? <span className="text-green-500">Selesai</span> : (dynamicTimesLeft > 0 ? `Sekitar ${dynamicTimesLeft} ${planUnit}` : '-')}
          </h2>
          {!isAchieved && dynamicTimesLeft > 0 && (
            <span className="text-xs md:text-sm text-slate-500 relative z-10 mt-1 font-medium">Atau {dynamicTimesLeft}x Setor</span>
          )}
        </div>
      </div>

      {/* Riwayat Pengisian */}
      <div className="bg-white border border-primary/30 rounded-3xl p-5 md:p-8 shadow-sm mb-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="font-bold text-slate-800">Riwayat Pengisian</h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
            {goal.savingsTransactions.length} Transaksi
          </span>
        </div>
        
        <div className="flex flex-col gap-4 sm:gap-6 overflow-y-auto max-h-[320px] pr-2">
          {goal.savingsTransactions.length > 0 ? (
            goal.savingsTransactions.map((item, idx, arr) => (
              <div key={item.id} className={`flex justify-between items-center ${idx !== arr.length - 1 ? 'pb-4 sm:pb-6 border-b border-slate-100' : ''}`}>
                <div className="flex flex-col gap-1 pr-2">
                  <span className="text-sm font-bold text-slate-800 leading-tight">{item.note || 'Pengisian Tabungan'}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`text-sm sm:text-base font-bold shrink-0 ${Number(item.amount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {Number(item.amount) < 0 ? '-' : '+'}{formatRupiah(Math.abs(Number(item.amount)))}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 italic py-4">Belum ada riwayat pengisian.</div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsTopUpOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white border-2 border-primary/40 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/5 hover:scale-105 transition-all cursor-pointer z-50"
      >
        <Plus className="w-6 h-6 text-primary" />
      </button>

      {/* Modals */}
      <TopUpModal 
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          fetchDetail(true);
          // Optionally show a toast here
        }}
        goalId={id}
        defaultAmount={goal.planAmount ? Number(goal.planAmount) : undefined}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Hapus Tabungan?</h2>
            <p className="text-center text-slate-500 mb-8 font-medium">
              Apakah lu yakin mau ngehapus tabungan <span className="font-bold text-slate-800">"{goal.name}"</span>? Uang yang udah terkumpul bakal tetep ada di dompet lu, cuma target tabungannya aja yang ilang.
            </p>

            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-8 py-3 rounded-full text-slate-500 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-8 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
