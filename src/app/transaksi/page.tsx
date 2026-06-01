"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, Pencil, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApiWallet {
  id: string;
  name: string;
  color: string;
}

interface ApiTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  description: string;
  category: string;
  date: string;
}

export default function RiwayatTransaksiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Semua");
  const [activeCategory, setActiveCategory] = useState("Semua kategori");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>("Semua");
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Toggle filter di mode mobile
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // State untuk fitur hapus massal
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: 'single' | 'bulk', id?: string}>({isOpen: false, type: 'single'});

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) {
        const json = await res.json();
        setWallets(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeWalletId !== "Semua") params.append("walletId", activeWalletId);
      if (activeTab === "Pemasukan") params.append("type", "INCOME");
      if (activeTab === "Pengeluaran") params.append("type", "EXPENSE");
      if (activeCategory !== "Semua kategori") params.append("category", activeCategory);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [activeWalletId, activeTab, activeCategory]);

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // Reset pilihan saat filter berubah
    setSelectedIds([]);
  }, [fetchTransactions]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ isOpen: true, type: 'single', id });
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({ isOpen: true, type: 'bulk' });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id) {
        const res = await fetch(`/api/transactions/${deleteModal.id}`, { method: "DELETE" });
        if (res.ok) {
          fetchTransactions();
        } else {
          alert("Gagal menghapus transaksi");
        }
      } else if (deleteModal.type === 'bulk') {
        const res = await fetch("/api/transactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionIds: selectedIds })
        });
        
        if (res.ok) {
          setSelectedIds([]);
          fetchTransactions();
        } else {
          const data = await res.json();
          alert(data.error || "Gagal menghapus transaksi massal");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, type: 'single' });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchTime = true;
    if (startDate || endDate) {
      const tDate = new Date(t.date);
      tDate.setHours(0,0,0,0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (tDate < start) matchTime = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (tDate > end) matchTime = false;
      }
    }
    
    return matchSearch && matchTime;
  });

  const groupedTransactions = filteredTransactions.reduce((groups, t) => {
    const dateObj = new Date(t.date);
    const dateKey = dateObj.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[dateKey]) {
      groups[dateKey] = { date: dateKey, items: [] };
    }
    groups[dateKey].items.push(t);
    return groups;
  }, {} as Record<string, { date: string, items: ApiTransaction[] }>);

  const transactionGroups = Object.values(groupedTransactions).sort((a, b) => new Date(b.items[0].date).getTime() - new Date(a.items[0].date).getTime());

  const categories = ["Semua kategori", "Makanan", "Transportasi", "Hiburan", "Tagihan", "Gaji", "Investasi", "Lainnya"];
  const tabs = ["Semua", "Pemasukan", "Pengeluaran"];

  return (
    <div className="w-full">
      {/* Panel Header */}
      <div className="bg-primary rounded-[2rem] p-8 text-white mb-8 shadow-md relative z-30">
        {/* Background bentuk abstrak */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold mb-2">Riwayat Transaksi</h1>
            <p className="text-xs md:text-base text-white/90">Ayo kelola transaksi kamu disini</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            {/* Pilihan Dompet */}
            <div className="relative md:w-72">
              <button 
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="w-full bg-white text-slate-800 rounded-full pl-12 pr-10 py-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors outline-none cursor-pointer"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none overflow-hidden" 
                     style={{ backgroundColor: activeWalletId !== "Semua" ? wallets.find(w => w.id === activeWalletId)?.color || 'var(--color-primary)' : 'var(--color-primary)' }}>
                </div>
                <span className="font-bold text-sm truncate flex-1 text-left">
                  {activeWalletId === "Semua" ? "Semua Dompet" : wallets.find(w => w.id === activeWalletId)?.name || "Pilih Dompet"}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isWalletDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-20 py-2">
                  <button
                    onClick={() => {
                      setActiveWalletId("Semua");
                      setIsWalletDropdownOpen(false);
                    }}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer text-sm font-bold text-left"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary shrink-0"></div>
                    <span className="truncate">Semua Dompet</span>
                  </button>
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setActiveWalletId(w.id);
                        setIsWalletDropdownOpen(false);
                      }}
                      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer text-sm font-bold text-left"
                    >
                      <div className="w-4 h-4 rounded-full shrink-0 opacity-80" style={{ backgroundColor: w.color || 'var(--color-primary)' }}></div>
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Kolom Pencarian */}
            <div className="flex-1 bg-white text-slate-800 rounded-full px-5 py-3.5 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                className="bg-transparent outline-none flex-1 text-sm font-medium w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* Tombol Toggle Filter Mobile */}
        <div className="lg:hidden w-full">
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl shadow-sm flex items-center justify-between px-6 hover:bg-slate-50 transition-colors"
          >
            <span>{isMobileFilterOpen ? "Sembunyikan Filter" : "Tampilkan Filter"}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isMobileFilterOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Sidebar filter di kiri */}
        <div className={`lg:col-span-1 flex-col gap-6 sticky top-6 self-start ${isMobileFilterOpen ? "flex" : "hidden lg:flex"}`}>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">Filter Transaksi</h3>
            
            {/* Tab Tipe Transaksi */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe</label>
              {tabs.map(tab => {
                let activeClass = "bg-primary text-white border-primary shadow-sm";
                if (tab === "Pemasukan") activeClass = "bg-green-500 text-white border-green-500 shadow-sm";
                else if (tab === "Pengeluaran") activeClass = "bg-red-500 text-white border-red-500 shadow-sm";

                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full py-2.5 px-4 text-left text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === tab 
                        ? activeClass 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            
            {/* Filter Waktu */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Rentang Waktu</label>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dari Tanggal</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sampai Tanggal</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="mt-3 w-full py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Reset Filter Waktu
                </button>
              )}
            </div>
            
            {/* Filter Kategori */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeCategory === cat 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Daftar transaksi di kanan */}
        <div className="lg:col-span-3 flex flex-col gap-6 md:gap-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Memuat riwayat transaksi...
              </span>
            </div>
          ) : transactionGroups.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm flex flex-col h-full overflow-hidden">
              
              {/* Baris Pilihan Atas */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => {
                      if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(filteredTransactions.map(t => t.id));
                      }
                    }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                      selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0
                        ? 'bg-[#00a859]' // warna hijau sesuai desain
                        : 'border-2 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {selectedIds.length > 0 && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"} {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href="/api/export/transactions"
                    download="transaksi-catatanku.csv"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-primary rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Riwayat
                  </a>
                  {selectedIds.length > 0 && (
                    <button 
                      onClick={confirmBulkDelete}
                      className="text-[#00a859] font-bold text-sm hover:text-green-700 transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto pr-3 h-full" style={{ scrollbarWidth: 'thin' }}>
                {transactionGroups.map((group, idx) => (
                  <div key={idx} className="flex flex-col gap-3 mb-8 last:mb-0">
                    <h3 className="text-sm font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2 sticky top-0 bg-white z-10 pt-1">{group.date}</h3>
                    
                    <div className="flex flex-col gap-3">
                      {group.items.map((item) => (
                        <div 
                          key={item.id} 
                          className={`group border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between bg-white hover:border-primary/30 hover:shadow-md transition-all gap-4 ${
                            selectedIds.includes(item.id) ? 'border-primary/50 bg-primary/5' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                              <div 
                                onClick={() => toggleSelection(item.id)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                                  selectedIds.includes(item.id) 
                                    ? 'bg-[#00a859]' 
                                    : 'border-2 border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {selectedIds.includes(item.id) && (
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-slate-800 text-sm md:text-base">{item.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                {item.category}
                              </span>
                              <span className="text-[10px] md:text-xs font-medium text-slate-400">
                                {new Date(item.date).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                            <span className={`font-bold text-lg ${item.type === "EXPENSE" ? 'text-red-500' : 'text-green-500'}`}>
                              {item.type === "EXPENSE" ? '-' : '+'}{new Intl.NumberFormat('id-ID', { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(item.amount))}
                            </span>
                            
                            <div className="flex items-center gap-3 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => router.push(`/transaksi/tambah/manual?editId=${item.id}`)} 
                                className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => confirmDelete(item.id)} 
                                className="p-2 bg-red-50 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white border border-dashed border-slate-300 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Tidak ada transaksi</h3>
              <p className="text-sm text-slate-500">Coba ubah filter pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-16 h-16 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Hapus Transaksi</h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              {deleteModal.type === 'bulk' 
                ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi terpilih? Data tidak dapat dikembalikan.`
                : "Apakah Anda yakin ingin menghapus transaksi ini? Data tidak dapat dikembalikan."}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
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
