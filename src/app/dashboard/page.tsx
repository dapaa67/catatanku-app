"use client";

import { useState } from "react";
import { WalletCard } from "@/components/WalletCard";
import { SelectWalletModal, Wallet } from "@/components/SelectWalletModal";
import { AddWalletModal, NewWalletData } from "@/components/AddWalletModal";
import { TransferBalanceModal } from "@/components/TransferBalanceModal";

// Data dummy awal untuk dompet
const initialWallets: Wallet[] = [
  { id: "1", name: "Dompet 1", balance: 100000000, color: "#00A3B5" },
  { id: "2", name: "Tabungan", balance: 15000000, color: "#00C853" },
];

export default function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  
  // State ID dompet yang sedang aktif
  const [activeWalletId, setActiveWalletId] = useState(wallets[0]?.id);

  // Ambil data dompet aktif, jika terhapus kembalikan ke dompet pertama
  const activeWallet = wallets.find(w => w.id === activeWalletId) || wallets[0];

  // Hitung total saldo dari semua dompet
  const totalBalance = wallets.reduce((acc, wallet) => acc + wallet.balance, 0);

  // Logika untuk menyimpan/edit dompet
  const handleSaveWallet = (data: NewWalletData) => {
    if (walletToEdit) {
      // Mode Edit
      setWallets(wallets.map(w => w.id === walletToEdit.id ? { ...w, ...data } : w));
    } else {
      // Mode Tambah
      const newWallet: Wallet = {
        ...data,
        id: crypto.randomUUID()
      };
      setWallets([...wallets, newWallet]);
      if (wallets.length === 0) setActiveWalletId(newWallet.id);
    }
    setIsAddModalOpen(false); // Tutup modal setelah save
    setWalletToEdit(null); // Reset
  };

  const handleDeleteWallet = (walletId: string) => {
    const updatedWallets = wallets.filter(w => w.id !== walletId);
    setWallets(updatedWallets);
    // Jika dompet yang aktif dihapus, pindah ke dompet lain
    if (activeWalletId === walletId && updatedWallets.length > 0) {
      setActiveWalletId(updatedWallets[0].id);
    }
  };

  const handleTransferWallet = (fromId: string, toId: string, amount: number) => {
    setWallets(wallets.map(w => {
      if (w.id === fromId) {
        return { ...w, balance: w.balance - amount };
      }
      if (w.id === toId) {
        return { ...w, balance: w.balance + amount };
      }
      return w;
    }));
    setIsTransferModalOpen(false);
  };

  // Tampilan Dashboard Utama
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Selamat datang kembali, Joko Anwar 👋</p>
      </div>

      {/* Bagian Atas (Total Saldo) */}
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Jumlah Saldo</p>
        <h2 className="text-4xl font-extrabold text-slate-800">
          {isBalanceHidden ? "Rp ••••••••" : new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalBalance)}
        </h2>
      </div>

      {/* Kartu Dompet Aktif (Full Width & Tinggi) */}
      <div className="w-full">
        {activeWallet ? (
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
          <div className="rounded-3xl p-6 bg-slate-100 border border-slate-200 w-full min-h-[240px] flex items-center justify-center text-slate-400">
            Belum ada tabungan
          </div>
        )}
      </div>

      {/* Modal Popup Pilih Tabungan */}
      <SelectWalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        wallets={wallets}
        activeWalletId={activeWalletId}
        totalBalance={totalBalance}
        isBalanceHidden={isBalanceHidden}
        onSelectWallet={(walletId) => {
          setActiveWalletId(walletId); // Ubah dompet aktif
          setIsModalOpen(false);     // Tutup modal
        }}
        onAddClick={() => {
          setWalletToEdit(null); // Pastikan mode tambah
          setIsModalOpen(false);     // Tutup modal pilih tabungan
          setIsAddModalOpen(true);   // Buka modal tambah tabungan
        }}
        onEditWalletClick={(wallet) => {
          setWalletToEdit(wallet); // Masuk mode edit
          setIsModalOpen(false);
          setIsAddModalOpen(true);
        }}
        onDeleteWalletClick={handleDeleteWallet}
        onTransferClick={() => {
          setIsModalOpen(false);
          setIsTransferModalOpen(true);
        }}
      />

      {/* Modal Tambah/Edit Tabungan */}
      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setWalletToEdit(null); }}
        onSave={handleSaveWallet}
        initialData={walletToEdit}
      />

      {/* Modal Pindah Saldo */}
      <TransferBalanceModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onTransfer={handleTransferWallet}
      />
    </div>
  );
}