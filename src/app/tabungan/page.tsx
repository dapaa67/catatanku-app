"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, AlignLeft, TrendingUp, Plus, Trash2 } from "lucide-react";
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

  // Bulk delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

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

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/savings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalIds: selectedIds })
      });
      
      if (res.ok) {
        setSelectedIds([]);
        fetchTabungan();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus tabungan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
      setDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 text-slate-800">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl font-bold mb-1 text-slate-800">Tabungan</h1>
        <p className="text-sm font-medium text-slate-500">Kelola target tabunganmu</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
        {/* Total Target */}
        <div className="bg-white border border-primary/30 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm flex flex-col justify-center">
          <span className="text-[11px] sm:text-sm font-bold text-slate-800 mb-1 sm:mb-3 truncate">
            <span className="sm:hidden">Target</span>
            <span className="hidden sm:inline">Total Target</span>
          </span>
          <h2 className="text-[13px] sm:text-3xl font-bold text-slate-800 truncate">{isLoading ? "..." : formatRupiah(totalTarget)}</h2>
        </div>

        {/* Total Terkumpul */}
        <div className="bg-white border border-primary/30 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm flex flex-col justify-center">
          <span className="text-[11px] sm:text-sm font-bold text-slate-800 mb-1 sm:mb-3 truncate">
            <span className="sm:hidden">Terkumpul</span>
            <span className="hidden sm:inline">Total Terkumpul</span>
          </span>
          <h2 className="text-[13px] sm:text-3xl font-bold text-slate-800 truncate">{isLoading ? "..." : formatRupiah(totalTerkumpul)}</h2>
        </div>

        {/* Progress Rata-rata */}
        <div className="bg-white border border-primary/30 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm flex flex-col justify-center">
          <span className="text-[11px] sm:text-sm font-bold text-slate-800 mb-1 sm:mb-3 truncate">
            <span className="sm:hidden">Progress</span>
            <span className="hidden sm:inline">Progress Rata-rata</span>
          </span>
          <h2 className="text-[13px] sm:text-3xl font-bold text-slate-800 truncate">{isLoading ? "..." : `${progressAvg.toFixed(1).replace('.', ',')}%`}</h2>
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

      {/* Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-8 w-full">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setSortBy(sortBy === "name" ? "progress" : "name")}
            className="flex items-center justify-between gap-1 sm:gap-2 bg-white border border-primary/30 rounded-full px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              <AlignLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">{sortBy === "name" ? "Nama" : "Progress"}</span>
                <span className="hidden sm:inline">{sortBy === "name" ? "Berdasarkan Nama" : "Berdasarkan Progress"}</span>
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </button>
          <button 
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center justify-between gap-1 sm:gap-2 bg-white border border-primary/30 rounded-full px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
              <span className="truncate">
                <span className="sm:hidden">{sortOrder === "asc" ? "Naik" : "Turun"}</span>
                <span className="hidden sm:inline">{sortOrder === "asc" ? "Meningkat" : "Menurun"}</span>
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
          <div 
            onClick={() => {
              if (selectedIds.length === sortedTabungan.length && sortedTabungan.length > 0) {
                setSelectedIds([]);
              } else {
                setSelectedIds(sortedTabungan.map(t => t.id));
              }
            }}
            className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              selectedIds.length === sortedTabungan.length && sortedTabungan.length > 0
                ? 'bg-[#00a859]' 
                : 'border-2 border-slate-300 hover:border-slate-400'
            }`}
          >
            {selectedIds.length > 0 && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="font-bold text-slate-800 text-sm">
            {selectedIds.length > 0 ? `${selectedIds.length} Dipilih` : "Pilih Semua"}
          </span>
          {selectedIds.length > 0 && (
            <button 
              onClick={confirmBulkDelete}
              className="text-red-500 font-bold text-sm hover:text-red-600 transition-colors cursor-pointer ml-2 border-l border-slate-200 pl-4"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-6 relative">
        {isLoading ? (
          <div className="flex justify-center p-8"><span className="text-slate-500">Memuat tabungan...</span></div>
        ) : sortedTabungan.length > 0 ? (
          sortedTabungan.map((item) => (
            <Link href={`/tabungan/${item.id}`} key={item.id} className={`bg-white border rounded-[2rem] p-4 sm:p-6 shadow-sm flex items-center gap-3 sm:gap-6 relative hover:shadow-md transition-all cursor-pointer ${selectedIds.includes(item.id) ? 'border-primary/50 ring-2 ring-primary/20' : 'border-primary/30'}`}>
              
              {/* Checkbox */}
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSelection(item.id);
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  selectedIds.includes(item.id) 
                    ? 'bg-[#00a859] border-none' 
                    : 'border-2 border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                {selectedIds.includes(item.id) && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              {/* Absolute % text */}
              <div className="absolute top-4 sm:top-6 right-5 sm:right-6 font-bold text-slate-800 text-xs sm:text-sm bg-slate-100 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded-full sm:rounded-none">
                {item.progressPercent}%
              </div>

              {/* Photo Box */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-slate-800 text-[10px] sm:text-sm">foto</span>
                )}
              </div>

              {/* Content Details */}
              <div className="flex flex-col flex-1 justify-center min-w-0 pt-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1 pr-12 truncate">{item.name}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-3 sm:mb-4 truncate">
                  {formatRupiah(Number(item.currentAmount))} / {formatRupiah(Number(item.targetAmount))}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden mb-2 sm:mb-3">
                  <div 
                    className="h-full bg-primary/80 rounded-full transition-all duration-500" 
                    style={{ width: `${item.progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[10px] sm:text-xs font-bold gap-1 sm:gap-0">
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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-16 h-16 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Tabungan</h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              Apakah Anda yakin ingin menghapus {selectedIds.length} tabungan terpilih? Data tidak dapat dikembalikan.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
