"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletCard } from "@/components/WalletCard";
import { SelectWalletModal, Wallet } from "@/components/SelectWalletModal";
import { AddWalletModal, NewWalletData } from "@/components/AddWalletModal";
import { TransferBalanceModal } from "@/components/TransferBalanceModal";
import Link from "next/link";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Info } from "lucide-react";

// ============================================================
// Types sesuai response dari backend
// ============================================================
interface ApiWallet {
  id: string;
  name: string;
  balance: string | number; // Prisma Decimal → bisa string dari JSON
  color: string;
  imageUrl?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SummaryData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingRate: number;
  topExpenseCategories?: { category: string, amount: number, percentage: number }[];
  topIncomeCategories?: { category: string, amount: number, percentage: number }[];
  trendLast6Months?: { month: string, year: number, income: number, expense: number }[];
}

interface DashboardTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  category: string;
  description: string;
  date: string;
}

// Konversi ApiWallet → Wallet (interface yang dipakai komponen)
function toWallet(w: ApiWallet): Wallet {
  return {
    id: w.id,
    name: w.name,
    balance: Number(w.balance),
    color: w.color,
    imageUrl: w.imageUrl ?? undefined,
  };
}

// ============================================================
// Skeleton loading card
// ============================================================
function WalletCardSkeleton() {
  return (
    <div className="rounded-3xl w-full min-h-[240px] bg-slate-200 animate-pulse" />
  );
}

// ============================================================
// Dashboard Page
// ============================================================
export default function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [activeWalletId, setActiveWalletId] = useState<string>("all");
  const [recentTransactions, setRecentTransactions] = useState<DashboardTransaction[]>([]);
  const [chartType, setChartType] = useState<"income" | "expense">("expense");
  const [userName, setUserName] = useState<string>("Loading...");

  // Fetch data dompet dan ringkasan keuangan dari API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = activeWalletId !== "all" ? `?walletId=${activeWalletId}` : "";
      const [walletsRes, summaryRes, transactionsRes] = await Promise.all([
        fetch("/api/wallets"),
        fetch(`/api/summary${q}`),
        fetch(`/api/transactions${q}`)
      ]);

      if (!walletsRes.ok) throw new Error("Gagal mengambil data dompet");
      if (!summaryRes.ok) throw new Error("Gagal mengambil ringkasan keuangan");

      const walletsJson = await walletsRes.json();
      const summaryJson = await summaryRes.json();
      const transactionsJson = await transactionsRes.json();

      const fetchedWallets: Wallet[] = (walletsJson.data as ApiWallet[]).map(toWallet);
      setWallets(fetchedWallets);
      setSummary(summaryJson.data as SummaryData);
      setRecentTransactions((transactionsJson.data || []).slice(0, 4));

      // Ambil nama user dari Supabase
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || "";
        const name = user.user_metadata?.name || email.split("@")[0] || "User";
        setUserName(name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [activeWalletId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ambil dompet yang sedang aktif
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0];
  const totalBalance = summary?.totalBalance ?? wallets.reduce((acc, w) => acc + w.balance, 0);

  // Handler simpan dan edit dompet
  const handleSaveWallet = async (data: NewWalletData) => {
    try {
      if (walletToEdit) {
        // Mode Edit → PUT /api/wallets/[id]
        const res = await fetch(`/api/wallets/${walletToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, color: data.color, balance: data.balance }),
        });
        if (!res.ok) throw new Error("Gagal memperbarui dompet");
      } else {
        // Mode Tambah → POST /api/wallets
        const res = await fetch("/api/wallets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            color: data.color,
            initialBalance: data.balance,
          }),
        });
        if (!res.ok) throw new Error("Gagal membuat dompet baru");
        const json = await res.json();
        // Set dompet yang baru dibuat sebagai aktif
        setActiveWalletId(json.data.id);
      }
      setIsAddModalOpen(false);
      setWalletToEdit(null);
      await fetchData(); // Refresh data dari server
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  // Handler hapus dompet
  const handleDeleteWallet = async (walletId: string) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus dompet");
      // Pindah ke dompet lain jika yang aktif dihapus
      if (activeWalletId === walletId) {
        const remaining = wallets.filter((w) => w.id !== walletId);
        setActiveWalletId(remaining[0]?.id);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  // Handler transfer saldo antar dompet
  const handleTransferWallet = async (fromId: string, toId: string, amount: number) => {
    try {
      const res = await fetch("/api/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromWalletId: fromId, toWalletId: toId, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal melakukan transfer");

      setIsTransferModalOpen(false);
      await fetchData(); // Refresh data dari server
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  // ============================================================
  // Render halaman utama
  // ============================================================
  return (
    <div className="flex flex-col gap-6 w-full pb-10">

      {/* Tampilan Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-red-600 text-sm font-medium">
          ⚠️ {error}
          <button
            onClick={fetchData}
            className="ml-3 underline hover:text-red-800 transition-colors"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Kartu Informasi Atas */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-0.5">Jumlah Saldo</p>
        {isLoading ? (
          <div className="h-6 w-32 bg-slate-200 animate-pulse rounded-xl mt-1" />
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 leading-none mt-1">
              {isBalanceHidden
                ? "Rp ••••••••"
                : new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalBalance)}
            </h2>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <Info size={12} className="text-primary" />
              <span className="text-[10px] font-medium">Total gabungan dari semua dompet</span>
            </div>
          </>
        )}
      </div>

      {/* Kartu Dompet Aktif */}
      <div className="w-full">
        {isLoading ? (
          <WalletCardSkeleton />
        ) : activeWalletId === "all" ? (
          <WalletCard
            name="Semua Dompet"
            balance={totalBalance}
            color="#0f9a95"
            isBalanceHidden={isBalanceHidden}
            onToggleHideBalance={() => setIsBalanceHidden(!isBalanceHidden)}
            onEditClick={() => setIsModalOpen(true)}
          />
        ) : activeWallet ? (
          <WalletCard
            name={activeWallet.name}
            balance={activeWallet.balance}
            color={activeWallet.color}
            imageUrl={activeWallet.imageUrl}
            isBalanceHidden={isBalanceHidden}
            onToggleHideBalance={() => setIsBalanceHidden(!isBalanceHidden)}
            onEditClick={() => setIsModalOpen(true)}
          />
        ) : (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-3xl p-6 bg-slate-100 border-2 border-slate-200 border-dashed w-full min-h-[240px] flex flex-col gap-4 items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-2xl font-bold">+</span>
            </div>
            <span className="font-medium">Belum ada dompet — tambah dompet pertamamu!</span>
          </button>
        )}
      </div>

      {/* Grid Konten Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
        {/* Kolom: Laporan bulan ini */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Laporan bulan ini</h3>
            <Link href="/analisis" className="text-xs font-bold text-primary hover:underline">Lihat lainnya</Link>
          </div>
          
          <div className="bg-white border border-primary/20 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-4">
              <button 
                onClick={() => setChartType("income")}
                className={`flex flex-col p-3 rounded-xl transition-colors cursor-pointer text-left ${chartType === "income" ? "bg-green-50/70 border border-green-100" : "hover:bg-slate-50 border border-transparent"}`}
              >
                <span className={`text-xs font-bold mb-1 ${chartType === "income" ? "text-green-700" : "text-slate-600"}`}>Total Pemasukan</span>
                <span className="text-sm font-bold text-green-500">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.totalIncome || 0)}
                </span>
              </button>
              <button 
                onClick={() => setChartType("expense")}
                className={`flex flex-col p-3 rounded-xl transition-colors cursor-pointer text-left ${chartType === "expense" ? "bg-red-50/70 border border-red-100" : "hover:bg-slate-50 border border-transparent"}`}
              >
                <span className={`text-xs font-bold mb-1 ${chartType === "expense" ? "text-red-700" : "text-slate-600"}`}>Total Pengeluaran</span>
                <span className="text-sm font-bold text-red-500">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.totalExpense || 0)}
                </span>
              </button>
            </div>
            
            {/* Area Grafik */}
            <div className="relative h-40 w-full mt-2">
              {(() => {
                const maxVal = summary?.trendLast6Months?.reduce((max, t) => Math.max(max, chartType === "expense" ? t.expense : t.income), 0) || 100000;
                const formatY = (val: number) => {
                  if (val >= 1000000) return (val / 1000000).toFixed(0) + "Jt";
                  if (val >= 1000) return (val / 1000).toFixed(0) + "K";
                  return val.toString();
                };
                const points = summary?.trendLast6Months?.map((t, i, arr) => {
                  const x = (i / (arr.length - 1)) * 100;
                  const val = chartType === "expense" ? t.expense : t.income;
                  const y = 100 - (val / maxVal) * 100;
                  return `${x} ${y}`;
                }).join(" L ") || "0 100 L 100 100";
                const pathD = `M ${points}`;
                const pathAreaD = `M ${points} L 100 100 L 0 100 Z`;

                const firstLabel = summary?.trendLast6Months?.[0]?.month || "01/04";
                const lastLabel = summary?.trendLast6Months?.[5]?.month || "30/04";
                const lastVal = summary?.trendLast6Months?.[5] ? (chartType === "expense" ? summary.trendLast6Months[5].expense : summary.trendLast6Months[5].income) : 0;
                
                const lineColor = chartType === "expense" ? "#ef4444" : "#22c55e"; // red-500 or green-500

                return (
                  <>
                    {/* Label Sumbu Y */}
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-5 items-end">
                      <span>{formatY(maxVal)}</span>
                      <span>{formatY(maxVal * 0.66)}</span>
                      <span>{formatY(maxVal * 0.33)}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Garis Grid */}
                    <div className="absolute inset-0 right-10 flex flex-col justify-between pb-5">
                      <div className="border-t border-dashed border-slate-200 w-full"></div>
                      <div className="border-t border-dashed border-slate-200 w-full"></div>
                      <div className="border-t border-dashed border-slate-200 w-full"></div>
                      <div className="border-t border-dashed border-slate-200 w-full"></div>
                    </div>
                    
                    {/* Visualisasi Garis Grafik */}
                    <div className="absolute inset-0 right-10 pb-5">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
                        <path d={pathAreaD} fill="url(#grad)" opacity="0.1" />
                        <defs>
                          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={lineColor} stopOpacity="1" />
                            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Interactive Hitboxes untuk Tooltip */}
                      <div className="absolute inset-0 flex justify-between z-20">
                        {summary?.trendLast6Months?.map((t, idx, arr) => {
                          const val = chartType === "expense" ? t.expense : t.income;
                          const formattedVal = new Intl.NumberFormat("id-ID").format(val);
                          
                          // Default show tooltip for the last item, but let hover/focus override others
                          // By using a group, hover and focus on this invisible column triggers the tooltip
                          return (
                            <button 
                              key={idx}
                              className="group flex-1 flex flex-col items-center h-full outline-none cursor-crosshair bg-transparent relative z-0 hover:z-50 focus:z-50 active:z-50"
                            >
                              <div className="w-px h-full bg-slate-400 border-dashed opacity-0 group-hover:opacity-50 group-focus:opacity-50 group-active:opacity-50 transition-opacity pointer-events-none"></div>
                              
                              {/* Tooltip Popup */}
                              <div className="absolute top-0 transform -translate-y-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 transition-opacity bg-slate-800 text-white shadow-xl rounded-lg px-3 py-1.5 flex flex-col items-center pointer-events-none">
                                <span className="text-xs font-bold leading-tight">Rp {formattedVal}</span>
                                <span className="text-[10px] leading-tight text-slate-300">{t.month}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Label Sumbu X */}
                    <div className="absolute bottom-0 left-0 right-10 flex justify-between text-[10px] font-bold text-slate-400">
                      {summary?.trendLast6Months?.map((t, idx) => (
                        <span key={idx}>{t.month}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Keterangan Grafik */}
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${chartType === "income" ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-[10px] font-medium text-slate-500">Tren 6 Bulan Terakhir</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kategori terbesar */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-slate-800 text-sm">Kategori terbesar</h3>
          
          <div className="bg-white border border-primary/20 rounded-3xl p-6 shadow-sm flex flex-col flex-1">
            <div className="flex flex-col gap-6 flex-1">
              {summary?.topExpenseCategories && summary.topExpenseCategories.length > 0 ? (
                summary.topExpenseCategories.slice(0, 4).map((item) => (
                  <div key={item.category} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                      <span>{item.category}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic flex items-center justify-center h-full">Belum ada pengeluaran bulan ini.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Transaksi Terakhir */}
      <div className="bg-white border border-primary/20 rounded-3xl p-6 shadow-sm flex flex-col gap-4 mt-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-slate-800 text-sm">Transaksi terakhir</h3>
          <Link href="/transaksi" className="text-xs font-bold text-primary hover:underline">Lihat semua</Link>
        </div>
        
        <div className="flex flex-col">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((item, idx, arr) => (
              <div key={item.id} className={`flex justify-between items-center py-3 ${idx !== arr.length - 1 ? 'border-b border-primary/20' : ''}`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{item.description}</span>
                  <span className="text-[10px] font-bold text-slate-500">{item.category} - {new Date(item.date).toLocaleDateString("id-ID")}</span>
                </div>
                <span className={`text-xs font-bold ${item.type === "EXPENSE" ? "text-red-500" : "text-green-500"}`}>
                  {item.type === "EXPENSE" ? "-" : "+"}
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(item.amount))}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 italic py-4 text-center">Belum ada transaksi.</div>
          )}
        </div>
      </div>

      {/* Modal Pilih Dompet */}
      <SelectWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={wallets}
        activeWalletId={activeWalletId ?? ""}
        totalBalance={totalBalance}
        isBalanceHidden={isBalanceHidden}
        onSelectWallet={(walletId) => {
          setActiveWalletId(walletId);
          setIsModalOpen(false);
        }}
        onAddClick={() => {
          setWalletToEdit(null);
          setIsModalOpen(false);
          setIsAddModalOpen(true);
        }}
        onEditWalletClick={(wallet) => {
          setWalletToEdit(wallet);
          setIsModalOpen(false);
          setIsAddModalOpen(true);
        }}
        onDeleteWalletClick={handleDeleteWallet}
        onTransferClick={() => {
          setIsModalOpen(false);
          setIsTransferModalOpen(true);
        }}
      />

      {/* Modal Tambah/Edit Dompet */}
      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setWalletToEdit(null);
        }}
        onSave={handleSaveWallet}
        initialData={walletToEdit}
      />

      {/* Modal Transfer Saldo */}
      <TransferBalanceModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onTransfer={handleTransferWallet}
      />
    </div>
  );
}