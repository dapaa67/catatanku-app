"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletCard } from "@/components/WalletCard";
import { SelectWalletModal, Wallet } from "@/components/SelectWalletModal";
import { AddWalletModal, NewWalletData } from "@/components/AddWalletModal";
import { TransferBalanceModal } from "@/components/TransferBalanceModal";

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
  const [activeWalletId, setActiveWalletId] = useState<string | undefined>();

  // ── Fetch wallets & summary dari API ──────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [walletsRes, summaryRes] = await Promise.all([
        fetch("/api/wallets"),
        fetch("/api/summary"),
      ]);

      if (!walletsRes.ok) throw new Error("Gagal mengambil data dompet");
      if (!summaryRes.ok) throw new Error("Gagal mengambil ringkasan keuangan");

      const walletsJson = await walletsRes.json();
      const summaryJson = await summaryRes.json();

      const fetchedWallets: Wallet[] = (walletsJson.data as ApiWallet[]).map(toWallet);
      setWallets(fetchedWallets);
      setSummary(summaryJson.data as SummaryData);

      // Set dompet aktif ke yang pertama jika belum ada
      if (!activeWalletId && fetchedWallets.length > 0) {
        setActiveWalletId(fetchedWallets[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [activeWalletId]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ambil data dompet aktif ────────────────────────────────
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0];
  const totalBalance = summary?.totalBalance ?? wallets.reduce((acc, w) => acc + w.balance, 0);

  // ── Save / Edit Dompet ─────────────────────────────────────
  const handleSaveWallet = async (data: NewWalletData) => {
    try {
      if (walletToEdit) {
        // Mode Edit → PUT /api/wallets/[id]
        const res = await fetch(`/api/wallets/${walletToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, color: data.color }),
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

  // ── Hapus Dompet ───────────────────────────────────────────
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

  // ── Transfer Saldo ──────────────────────────────────────────
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
  // Render
  // ============================================================
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Selamat datang kembali 👋</p>
      </div>

      {/* Error state */}
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

      {/* Total Saldo */}
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Jumlah Saldo</p>
        {isLoading ? (
          <div className="h-10 w-56 bg-slate-200 animate-pulse rounded-xl" />
        ) : (
          <h2 className="text-4xl font-extrabold text-slate-800">
            {isBalanceHidden
              ? "Rp ••••••••"
              : new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(totalBalance)}
          </h2>
        )}
      </div>

      {/* Kartu Dompet Aktif */}
      <div className="w-full">
        {isLoading ? (
          <WalletCardSkeleton />
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

      {/* Summary ringkas (income & expense bulan ini) */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Pemasukan Bulan Ini</p>
            <p className="text-lg font-bold text-green-700">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-lg font-bold text-red-600">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(summary.totalExpense)}
            </p>
          </div>
        </div>
      )}

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