"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, Pencil, Trash2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>("Semua");
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
      } else {
        alert("Gagal menghapus transaksi");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="flex flex-col w-full pb-10">
      {/* Header Panel */}
      <div className="bg-primary rounded-[2rem] p-8 text-white mb-6 shadow-md relative">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Riwayat Transaksi</h1>
            <p className="text-sm md:text-base text-white/90">Ayo kelola transaksi kamu disini</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            {/* Wallet Selector Custom Dropdown */}
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
            
            {/* Search */}
            <div className="flex-1 bg-white text-slate-800 rounded-full px-5 py-3.5 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-transparent outline-none flex-1 text-sm font-medium" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="border border-primary/20 rounded-[2rem] p-6 mb-8 bg-white shadow-sm">
        {/* Type Tabs */}
        <div className="flex gap-4 mb-6">
          {tabs.map(tab => {
            let activeClass = "bg-[#FAFFB8] text-slate-800 border border-[#e6eb9d]";
            if (tab === "Pemasukan") {
              activeClass = "bg-green-100 text-green-700 border-green-200";
            } else if (tab === "Pengeluaran") {
              activeClass = "bg-red-100 text-red-700 border-red-200";
            }

            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center text-sm font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === tab 
                    ? activeClass 
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
        
        {/* Time Filter */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-800 mb-2">Filter waktu</label>
          <div className="border border-slate-200 rounded-full px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-sm font-medium text-slate-500">Semua Bulan</span>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Filter kategori</label>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? "bg-[#FAFFB8] text-slate-800 border border-[#e6eb9d]" 
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-8">
        {isLoading ? (
          <div className="flex justify-center p-8"><span className="text-slate-500">Memuat data...</span></div>
        ) : transactionGroups.length > 0 ? (
          transactionGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-800 mb-1">{group.date}</h3>
              
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-primary/20 rounded-full px-6 py-4 flex items-center justify-between bg-white hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-800">{item.description}</span>
                      <span className="text-xs font-medium text-slate-500">{item.category} - {new Date(item.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <span className={`font-bold ${item.type === "EXPENSE" ? 'text-red-500' : 'text-green-500'}`}>
                        {item.type === "EXPENSE" ? '-' : '+'}{new Intl.NumberFormat('id-ID', { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(item.amount))}
                      </span>
                      
                      <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
                        <button onClick={() => router.push(`/transaksi/tambah/manual?editId=${item.id}`)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-white border border-dashed border-primary/30 rounded-3xl text-slate-500">
            Tidak ada riwayat transaksi yang ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
