"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Image as ImageIcon, Camera, Plus, Loader2 } from "lucide-react";

const EXPENSE_CATEGORIES = ["Makanan", "Belanja", "Transport", "Tagihan", "Rumah", "Kesehatan", "Hiburan", "Lainnya"];
const INCOME_CATEGORIES = ["Gaji", "Investasi", "Bonus", "Lainnya"];

type Wallet = {
  id: string;
  name: string;
  color: string;
};

export default function TambahTransaksiPage() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  
  // Wallet state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  
  // Form state
  const [rawAmount, setRawAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Makanan");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize date, time, and fetch wallets
  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split("T")[0]);
    setTime(now.toTimeString().split(" ")[0].substring(0, 5));
    
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setWallets(data.data);
          // Auto select first wallet
          setSelectedWallet(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data dompet:", err);
    }
  };

  const categories = transactionType === "pemasukan" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type: "pemasukan" | "pengeluaran") => {
    setTransactionType(type);
    setSelectedCategory(type === "pemasukan" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setRawAmount(numericValue);
    
    if (numericValue === "") {
      setDisplayAmount("");
      return;
    }

    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10));
    setDisplayAmount(formatted);
  };

  const handleSubmit = async () => {
    if (!selectedWallet) {
      setError("Silakan pilih dompet terlebih dahulu");
      return;
    }
    if (!rawAmount || parseInt(rawAmount, 10) <= 0) {
      setError("Jumlah transaksi tidak valid");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Create a proper combined Date object for the backend
      const combinedDateTimeString = `${date}T${time}:00`;
      
      const payload = {
        walletId: selectedWallet.id,
        type: transactionType === "pemasukan" ? "INCOME" : "EXPENSE",
        amount: parseFloat(rawAmount),
        category: selectedCategory,
        description: note || selectedCategory, // Use category as description if note is empty
        note: note,
        date: new Date(combinedDateTimeString).toISOString()
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan transaksi");
      }

      // Success, redirect to dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh to update dashboard balances
      
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Panel */}
      <div className={`rounded-3xl p-8 flex flex-col items-center justify-center text-white relative shadow-md transition-colors duration-300 ${transactionType === "pemasukan" ? "bg-[#0f9a95]" : "bg-red-500"}`}>
        <h1 className="text-2xl font-bold mb-1">
          {transactionType === "pemasukan" ? "Tambah Pemasukan" : "Tambah Pengeluaran"}
        </h1>
        <p className="text-sm text-white/90 mb-6">
          {transactionType === "pemasukan" ? "Ayo catat sumber pemasukanmu" : "Catat pengeluaran agar lebih terkontrol"}
        </p>
        
        {/* Wallet Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
            className="bg-white text-slate-800 px-6 py-3 rounded-full flex items-center gap-3 font-medium text-sm w-72 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div 
              className="w-5 h-5 rounded-full" 
              style={{ backgroundColor: selectedWallet?.color || (transactionType === "pemasukan" ? "#0f9a95" : "#ef4444") }}
            ></div>
            <span className="flex-1 text-left truncate">
              {selectedWallet ? selectedWallet.name : (wallets.length === 0 ? "Memuat Dompet..." : "Pilih Dompet")}
            </span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isWalletDropdownOpen && wallets.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-10 py-2">
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          {error}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-6">Detail Transaksi</h2>

        <div className="flex flex-col gap-6">
          {/* Tipe Transaksi Toggle */}
          <div className="flex gap-4 p-1.5 bg-slate-100 rounded-full">
            <button
              onClick={() => handleTypeChange("pemasukan")}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                transactionType === "pemasukan"
                  ? "bg-white text-[#0f9a95] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => handleTypeChange("pengeluaran")}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                transactionType === "pengeluaran"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Jumlah Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Jumlah</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className={`font-bold text-lg ${transactionType === "pemasukan" ? "text-[#0f9a95]" : "text-red-500"}`}>Rp</span>
              </div>
              <input
                type="text"
                value={displayAmount}
                onChange={handleAmountChange}
                className={`block w-full pl-14 pr-4 py-4 rounded-2xl border-2 bg-slate-50 text-xl font-bold outline-none transition-colors ${
                  transactionType === "pemasukan" 
                    ? "border-transparent focus:border-[#0f9a95] focus:bg-white text-slate-800" 
                    : "border-transparent focus:border-red-500 focus:bg-white text-slate-800"
                }`}
                placeholder="0"
              />
            </div>
          </div>

          {/* Catatan Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Catatan</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="block w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-slate-50 focus:border-slate-300 focus:bg-white outline-none text-slate-800 placeholder:text-slate-400 font-medium transition-colors"
              placeholder="Contoh: Beli makan siang"
            />
          </div>

          {/* Kategori Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wider">Kategori</label>
            <div className="flex gap-2.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer hover:shadow-sm ${
                    selectedCategory === cat
                      ? transactionType === "pemasukan"
                        ? "border-[#0f9a95] bg-teal-50 text-[#0f9a95]"
                        : "border-red-500 bg-red-50 text-red-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button className="px-5 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tanggal & Jam */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-5 py-3.5 rounded-2xl border-2 border-transparent bg-slate-50 focus:border-slate-300 focus:bg-white outline-none text-slate-700 font-medium transition-colors cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Waktu</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="block w-full px-5 py-3.5 rounded-2xl border-2 border-transparent bg-slate-50 focus:border-slate-300 focus:bg-white outline-none text-slate-700 font-medium transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Lampiran Foto (Opsional)</label>
            <div className="flex gap-4">
              <button className="flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span className="font-medium text-sm">Pilih Galeri</span>
              </button>
              <button className="flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                <Camera className="w-5 h-5" />
                <span className="font-medium text-sm">Ambil Foto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={() => router.back()}
          className="flex-1 py-4 rounded-full border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
        >
          Batal
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex-[2] py-4 flex items-center justify-center gap-2 rounded-full text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${
            transactionType === "pemasukan" ? "bg-[#0f9a95] hover:bg-teal-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          <span>{isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}</span>
        </button>
      </div>
    </div>
  );
}
