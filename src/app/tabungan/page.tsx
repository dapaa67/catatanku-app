"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, AlignLeft, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import TambahTabunganModal from "./components/TambahTabunganModal";

interface ApiSavingGoal {
  id: string;
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
  deadline?: string | null;
  planType?: string | null;
  planAmount?: string | null;
  photoUrl?: string | null;
  status: "BERLANGSUNG" | "TERCAPAI";
  progressPercent: number;
  remainingAmount: number;
}

export default function TabunganPage() {
  const [activeTab, setActiveTab] = useState("Berlangsung");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tabunganList, setTabunganList] = useState<ApiSavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "progress">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchTabungan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/savings");
      if (res.ok) {
        const json = await res.json();
        setTabunganList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTabungan();
  }, [fetchTabungan]);

  const activeTabungan = tabunganList.filter(t => 
    activeTab === "Berlangsung" ? t.status === "BERLANGSUNG" : t.status === "TERCAPAI"
  );

  const sortedTabungan = [...activeTabungan].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a.progressPercent - b.progressPercent;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalTarget = tabunganList.reduce((acc, t) => acc + Number(t.targetAmount), 0);
  const totalTerkumpul = tabunganList.reduce((acc, t) => acc + Number(t.currentAmount), 0);
  const progressAvg = totalTarget > 0 ? (totalTerkumpul / totalTarget) * 100 : 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col w-full pb-20 text-slate-800">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 text-slate-800">Tabungan</h1>
        <p className="text-sm font-medium text-slate-500">Kelola target tabunganmu</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Target */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-bold text-slate-800 mb-3">Total Target</span>
          <h2 className="text-3xl font-bold text-slate-800">{isLoading ? "..." : formatRupiah(totalTarget)}</h2>
        </div>

        {/* Total Terkumpul */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-bold text-slate-800 mb-3">Total Terkumpul</span>
          <h2 className="text-3xl font-bold text-slate-800">{isLoading ? "..." : formatRupiah(totalTerkumpul)}</h2>
        </div>

        {/* Progress Rata-rata */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-bold text-slate-800 mb-3">Progress Rata-rata</span>
          <h2 className="text-3xl font-bold text-slate-800">{isLoading ? "..." : `${progressAvg.toFixed(1).replace('.', ',')}%`}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab("Berlangsung")}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "Berlangsung" 
              ? "border border-primary/30 bg-white text-slate-800 shadow-sm" 
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Berlangsung
        </button>
        <button 
          onClick={() => setActiveTab("Tercapai")}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "Tercapai" 
              ? "border border-primary/30 bg-white text-slate-800 shadow-sm" 
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Tercapai
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => setSortBy(sortBy === "name" ? "progress" : "name")}
          className="flex items-center gap-2 bg-white border border-primary/30 rounded-full px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <AlignLeft className="w-4 h-4 text-slate-500" />
          <span>{sortBy === "name" ? "Berdasarkan Nama" : "Berdasarkan Progress"}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
        <button 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center gap-2 bg-white border border-primary/30 rounded-full px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <TrendingUp className={`w-4 h-4 text-slate-500 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
          <span>{sortOrder === "asc" ? "Meningkat" : "Menurun"}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-6 relative">
        {isLoading ? (
          <div className="flex justify-center p-8"><span className="text-slate-500">Memuat tabungan...</span></div>
        ) : sortedTabungan.length > 0 ? (
          sortedTabungan.map((item) => (
            <Link href={`/tabungan/${item.id}`} key={item.id} className="bg-white border border-primary/30 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative hover:shadow-md transition-shadow cursor-pointer">
              
              {/* Absolute % text */}
              <div className="absolute top-6 right-6 font-bold text-slate-800 text-sm">
                {item.progressPercent}%
              </div>

              {/* Photo Box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-slate-800 text-sm">foto</span>
                )}
              </div>

              {/* Content Details */}
              <div className="flex flex-col flex-1 justify-center pt-2">
                <h3 className="font-bold text-slate-800 mb-1 pr-10">{item.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  {formatRupiah(Number(item.currentAmount))} / {formatRupiah(Number(item.targetAmount))}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary/80 rounded-full" 
                    style={{ width: `${item.progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Estimasi: {item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID') : '-'}</span>
                  <span className="text-[#10b981]">{item.planAmount ? `${formatRupiah(Number(item.planAmount))}/${item.planType}` : '-'}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-8 bg-white border border-dashed border-primary/30 rounded-3xl text-slate-500">
            Tidak ada tabungan {activeTab.toLowerCase()}.
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white border-2 border-primary/40 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/5 hover:scale-105 transition-all cursor-pointer z-50"
      >
        <Plus className="w-6 h-6 text-primary" />
      </button>

      {/* Modals */}
      <TambahTabunganModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTabungan();
        }}
      />
    </div>
  );
}
