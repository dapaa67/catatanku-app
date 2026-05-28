"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Sparkles, Trash2, ArrowRight } from "lucide-react";

const EXPENSE_CATEGORIES = ["Konsumsi", "Belanja", "Transportasi", "Tagihan", "Tempat Tinggal", "Kesehatan", "Hiburan", "Lain-lain"];
const INCOME_CATEGORIES = ["Pendapatan", "Investasi", "Lain-lain"];

type Wallet = {
  id: string;
  name: string;
  color: string;
};

type DraftTransaction = {
  id: string;
  name: string;
  amount: number;
  type: "pemasukan" | "pengeluaran";
  category: string;
  date: string;
  time: string;
  isLoading: boolean; // true while AI is predicting
  originalInput: string;
  originalCategory: string | null;
  isCategoryCorrect: boolean | null;
};

export default function TambahTransaksiPage() {
  const router = useRouter();
  
  // Wallet state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  
  // Form state
  const [naturalInput, setNaturalInput] = useState<string>("");
  const [drafts, setDrafts] = useState<DraftTransaction[]>([]);
  
  // App state
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);

  // Initialize and fetch wallets
  useEffect(() => {
    setIsClient(true);
    
    // Auto-restore drafts dari local storage supaya tidak hilang
    const savedDrafts = localStorage.getItem("catatanku_manual_drafts");
    const savedInput = localStorage.getItem("catatanku_manual_input");
    
    if (savedDrafts) {
      try { setDrafts(JSON.parse(savedDrafts)); } catch (e) {}
    }
    if (savedInput) {
      setNaturalInput(savedInput);
    }

    fetchWallets();
  }, []);

  // Auto-save ke local storage setiap kali ada perubahan
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("catatanku_manual_drafts", JSON.stringify(drafts));
      localStorage.setItem("catatanku_manual_input", naturalInput);
    }
  }, [drafts, naturalInput, isClient]);

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setWallets(data.data);
          setSelectedWallet(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data dompet:", err);
    }
  };

  // Helper to parse price from string
  const parseAmountAndName = (part: string) => {
    const priceRegex = /((?:\d{1,3}(?:\.\d{3})+|\d+))\s*(rb|ribu|k|jt|juta|m)?\b/i;
    const match = part.match(priceRegex);
    
    let amount = 0;
    let name = part;
    
    if (match) {
      let numStr = match[1].replace(/\./g, '');
      let num = parseFloat(numStr);
      let suffix = match[2] ? match[2].toLowerCase() : '';
      
      if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
        num *= 1000;
      } else if (suffix === 'jt' || suffix === 'juta') {
        num *= 1000000;
      } else if (suffix === 'm') {
        num *= 1000000000;
      }
      
      amount = num;
      // Remove the matched price from the name
      name = part.replace(match[0], '').trim();
    }
    
    return { name: name || "Transaksi", amount: amount || 0 };
  };

  const handleParseInput = async () => {
    if (!naturalInput.trim()) return;
    
    setIsParsing(true);
    
    // Split by comma
    const parts = naturalInput.split(",").map(p => p.trim()).filter(Boolean);
    
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

    // Initial draft generation
    const newDrafts: DraftTransaction[] = parts.map((part) => {
      const { name, amount } = parseAmountAndName(part);
      return {
        id: Math.random().toString(36).substr(2, 9),
        name,
        amount,
        type: "pengeluaran", // default
        category: "Lainnya", // default
        date: currentDate,
        time: currentTime,
        isLoading: true,
        originalInput: part,
        originalCategory: null,
        isCategoryCorrect: null
      };
    });

    // Add to state immediately so user sees loading cards
    setDrafts(prev => [...newDrafts, ...prev]);
    setNaturalInput(""); // clear input
    
    // Predict categories in parallel
    await Promise.all(
      newDrafts.map(async (draft) => {
        try {
          const res = await fetch("https://yobby15-catatanku-fastapi.hf.space/api/predict/kategori", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deskripsi_transaksi: draft.name })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.hasil && data.hasil.length > 0) {
              let predictedKategori = data.hasil[0].kategori;
              
              // Heuristic override for obvious income keywords
              const lowerName = draft.name.toLowerCase();
              const incomeKeywords = ["gaji", "arisan", "dapat", "terima", "bonus", "cair", "profit", "dividen", "jual", "refund"];
              let hasIncomeKeyword = incomeKeywords.some(kw => lowerName.includes(kw));
              
              // Smart heuristic for "utang" / "hutang"
              // "rusdi bayar utang" -> Pemasukan (someone paying us)
              // "bayar utang ke rusdi" -> Pengeluaran (we are paying)
              if (lowerName.includes("bayar utang") || lowerName.includes("bayar hutang")) {
                if (!lowerName.trim().startsWith("bayar")) {
                  hasIncomeKeyword = true;
                }
              }
              
              let isIncome = hasIncomeKeyword || INCOME_CATEGORIES.includes(predictedKategori);
              
              if (hasIncomeKeyword && !INCOME_CATEGORIES.includes(predictedKategori)) {
                // If it's obviously an income but AI said expense, override to Pendapatan
                predictedKategori = "Pendapatan";
                isIncome = true;
              }
              
              setDrafts(current => current.map(d => {
                if (d.id === draft.id) {
                  return {
                    ...d,
                    category: predictedKategori,
                    type: isIncome ? "pemasukan" : "pengeluaran",
                    isLoading: false,
                    originalCategory: predictedKategori
                  };
                }
                return d;
              }));
              return;
            }
          }
        } catch (err) {
          console.error("Gagal memprediksi kategori untuk:", draft.name);
        }
        
        // If fail, just stop loading
        setDrafts(current => current.map(d => 
          d.id === draft.id ? { ...d, isLoading: false } : d
        ));
      })
    );
    
    setIsParsing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParseInput();
    }
  };

  const updateDraft = (id: string, field: keyof DraftTransaction, value: any) => {
    setDrafts(prev => prev.map(draft => {
      if (draft.id === id) {
        // Handle type change by auto-switching category if needed
        if (field === 'type') {
          const newCategory = value === 'pemasukan' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
          return { ...draft, [field]: value, category: newCategory };
        }
        return { ...draft, [field]: value };
      }
      return draft;
    }));
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== id));
  };

  const handleSubmitAll = async () => {
    if (!selectedWallet) {
      setError("Silakan pilih dompet terlebih dahulu");
      return;
    }
    if (drafts.length === 0) {
      setError("Tidak ada transaksi untuk disimpan");
      return;
    }
    
    // Validation
    const invalid = drafts.find(d => d.amount <= 0 || !d.name);
    if (invalid) {
      setError("Beberapa transaksi memiliki jumlah atau nama yang tidak valid");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // We will send them sequentially or parallel, let's do sequentially to be safe with DB
      for (const draft of drafts) {
        const combinedDateTimeString = `${draft.date}T${draft.time}:00`;
        
        const payload = {
          walletId: selectedWallet.id,
          type: draft.type === "pemasukan" ? "INCOME" : "EXPENSE",
          amount: draft.amount,
          category: draft.category,
          description: draft.name, 
          note: draft.name,
          date: new Date(combinedDateTimeString).toISOString(),
          ...(draft.originalCategory && {
            aiTrainingData: {
              inputText: draft.originalInput,
              guessedCategory: draft.originalCategory,
              correctCategory: draft.category,
              isCorrect: draft.category === draft.originalCategory
            }
          })
        };

        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Gagal menyimpan transaksi: ${draft.name}`);
        }
      }

      // Success, clear storage and redirect
      setDrafts([]);
      setNaturalInput("");
      localStorage.removeItem("catatanku_manual_drafts");
      localStorage.removeItem("catatanku_manual_input");
      
      router.push("/dashboard");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Standard Header Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="text-slate-800">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Catat Cepat</h1>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Ketik transaksimu sekaligus pisahkan dengan koma. Sistem akan memilahnya otomatis.
            </p>
          </div>
          
          {/* Wallet Dropdown */}
          <div className="relative shrink-0 z-20 md:min-w-[240px]">
            <button 
              onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
              className="bg-white text-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 font-semibold text-sm w-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full shadow-inner border border-slate-200" 
                style={{ backgroundColor: selectedWallet?.color || "#0f9a95" }}
              ></div>
              <span className="flex-1 text-left truncate">
                {selectedWallet ? selectedWallet.name : (wallets.length === 0 ? "Memuat..." : "Pilih Dompet")}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isWalletDropdownOpen && wallets.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xl py-2 transform origin-top transition-all animate-in fade-in zoom-in-95">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setIsWalletDropdownOpen(false);
                    }}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer text-sm font-medium"
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wallet.color }}></div>
                    <span className="flex-1 text-left truncate">{wallet.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          {error}
        </div>
      )}

      {/* Premium Input Card */}
      <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all focus-within:shadow-[0_8px_40px_rgba(15,154,149,0.12)] focus-within:border-primary/30 group">
        <div className="relative bg-slate-50/70 rounded-2xl overflow-hidden border border-transparent group-focus-within:border-primary/10 transition-colors">
          <textarea
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contoh: Beli makan siang 25k, gojek 15rb, token listrik 100k..."
            className="w-full bg-transparent border-none p-6 text-slate-900 text-lg font-medium placeholder:text-slate-400 outline-none resize-none h-36"
          ></textarea>
          
          <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
            <button
              onClick={handleParseInput}
              disabled={isParsing || !naturalInput.trim()}
              className="ml-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:scale-100 disabled:shadow-none shadow-lg shadow-slate-900/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Proses Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      {drafts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-teal-50 text-primary flex items-center justify-center text-sm">
                {drafts.length}
              </span>
              Draft Transaksi
            </h2>
            <button 
              onClick={() => setDrafts([])}
              className="text-sm font-medium text-red-500 hover:text-red-600 cursor-pointer"
            >
              Hapus Semua
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {drafts.map((draft) => (
              <div 
                key={draft.id} 
                className={`bg-white rounded-2xl border-l-4 ${draft.type === 'pemasukan' ? 'border-l-[#0f9a95] border-y border-r border-slate-100' : 'border-l-red-500 border-y border-r border-slate-100'} p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                {/* AI Loading State Overlay */}
                {draft.isLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-2 text-primary font-medium text-sm animate-pulse">
                      <Sparkles className="w-4 h-4" /> AI Menganalisa...
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* Top Row: Type & Delete */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => updateDraft(draft.id, 'type', 'pemasukan')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          draft.type === 'pemasukan' ? 'bg-white text-[#0f9a95] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Pemasukan
                      </button>
                      <button
                        onClick={() => updateDraft(draft.id, 'type', 'pengeluaran')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          draft.type === 'pengeluaran' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Pengeluaran
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeDraft(draft.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Left Column: Name & Amount */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Catatan</label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateDraft(draft.id, 'name', e.target.value)}
                          className="w-full mt-1 bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl px-4 py-2 text-sm text-slate-900 font-medium outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Jumlah</label>
                        <div className="relative mt-1">
                          <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${draft.type === 'pemasukan' ? 'text-[#0f9a95]' : 'text-red-500'}`}>Rp</span>
                          <input
                            type="text"
                            value={draft.amount ? draft.amount.toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              updateDraft(draft.id, 'amount', val ? parseInt(val, 10) : 0);
                            }}
                            className="w-full bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl pl-12 pr-4 py-2 text-sm text-slate-900 font-bold outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Category, Date, Time */}
                    <div className="flex-1 flex flex-col gap-3">
                       <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Kategori</label>
                          
                          {/* Input Kategori dengan Datalist (Combobox) */}
                          <div className="relative mt-1">
                            <input
                              type="text"
                              list={`categories-${draft.id}`}
                              value={draft.category}
                              onChange={(e) => updateDraft(draft.id, 'category', e.target.value)}
                              placeholder="Ketik kategori baru..."
                              className="w-full bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl px-4 py-2 text-sm text-slate-900 font-medium outline-none transition-colors"
                            />
                            <datalist id={`categories-${draft.id}`}>
                              {(() => {
                                const options = draft.type === 'pemasukan' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];
                                return options.map(cat => (
                                  <option key={cat} value={cat} />
                                ));
                              })()}
                            </datalist>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Tanggal</label>
                            <input
                              type="date"
                              value={draft.date}
                              onChange={(e) => updateDraft(draft.id, 'date', e.target.value)}
                              className="w-full mt-1 bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-sm text-slate-900 font-medium outline-none transition-colors"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Waktu</label>
                            <input
                              type="time"
                              value={draft.time}
                              onChange={(e) => updateDraft(draft.id, 'time', e.target.value)}
                              className="w-full mt-1 bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-sm text-slate-900 font-medium outline-none transition-colors"
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Premium Pill Action */}
          <div className="fixed bottom-6 left-0 right-0 sm:left-64 flex justify-center z-40 pointer-events-none px-4">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 p-3 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex items-center justify-between gap-6 pointer-events-auto transform transition-all hover:-translate-y-1 w-full max-w-xl mx-auto">
              <div className="px-4 hidden sm:block">
                <span className="text-sm font-semibold text-slate-600">
                  <strong className="text-primary mr-1">{drafts.length}</strong> 
                  transaksi siap disimpan
                </span>
              </div>
              <button 
                onClick={handleSubmitAll}
                disabled={isSubmitting || drafts.some(d => d.isLoading)}
                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                <span>Simpan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
