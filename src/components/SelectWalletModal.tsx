import { useState } from "react";
import { Pencil, Trash2, CheckCircle, RefreshCw, Plus, X, AlertTriangle } from "lucide-react";

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  imageUrl?: string;
}

interface SelectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  activeWalletId: string;
  totalBalance: number;
  isBalanceHidden: boolean;
  onSelectWallet: (walletId: string) => void;
  onAddClick?: () => void;
  onEditWalletClick?: (wallet: Wallet) => void;
  onDeleteWalletClick?: (walletId: string) => void;
  onTransferClick?: () => void;
}

export function SelectWalletModal({ 
  isOpen, onClose, wallets, activeWalletId, totalBalance, isBalanceHidden, 
  onSelectWallet, onAddClick, onEditWalletClick, onDeleteWalletClick, onTransferClick 
}: SelectWalletModalProps) {
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);

  if (!isOpen) {
    if (walletToDelete) setWalletToDelete(null); // Reset when closed
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Container Modal Putih */}
      <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-lg relative flex flex-col max-h-[90vh]">
        
        {/* Tombol Close (X) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* Header Modal */}
        <h2 className="text-xl font-bold text-primary text-center mb-6">Pilih Tabungan</h2>
        
        {/* Konten Bisa di-Scroll */}
        <div className="overflow-y-auto flex-1 pr-2">
          <p className="text-xs font-bold text-slate-400 mb-3 tracking-wider">DOMPET REGULER</p>
          <div className="flex flex-col gap-3">
            {/* Pilihan Semua Dompet */}
            <div 
              onClick={() => onSelectWallet("all")}
              className={`flex items-center justify-between p-4 rounded-2xl transition-colors cursor-pointer border ${activeWalletId === "all" ? "bg-primary/5 border-primary/30 shadow-[0_2px_10px_rgba(15,154,149,0.1)]" : "bg-slate-50 hover:bg-slate-100 border-transparent"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex-shrink-0 bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">Σ</span>
                </div>
                <div className="text-left">
                  <h3 className="text-slate-800 font-bold text-lg">Semua Dompet</h3>
                  <p className="text-slate-500 font-medium text-xs">Total keseluruhan</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <button className="hover:text-emerald-500 transition-colors cursor-pointer">
                  <CheckCircle size={22} className={activeWalletId === "all" ? "text-emerald-500" : ""} />
                </button>
              </div>
            </div>
            {wallets.map((wallet) => (
              <div 
                key={wallet.id} 
                onClick={() => onSelectWallet(wallet.id)}
                className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Gambar atau Warna Dompet */}
                  <div 
                    className="w-12 h-12 rounded-full flex-shrink-0 bg-cover bg-center"
                    style={{ 
                      backgroundColor: wallet.color,
                      backgroundImage: wallet.imageUrl ? `url(${wallet.imageUrl})` : undefined
                    }}
                  ></div>
                  
                  {/* Detail Dompet */}
                  <div className="text-left">
                    <h3 className="text-slate-800 font-bold text-lg">{wallet.name}</h3>
                    <p className="text-emerald-500 font-semibold text-sm">
                      {isBalanceHidden ? "Rp ••••••••" : new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(wallet.balance)}
                    </p>
                  </div>
                </div>

                {/* Aksi Tambahan */}
                <div className="flex items-center gap-4 text-slate-400">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditWalletClick?.(wallet); }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setWalletToDelete(wallet.id); }}
                    className="hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="hover:text-emerald-500 transition-colors cursor-pointer">
                    <CheckCircle size={22} className={wallet.id === activeWalletId ? "text-emerald-500" : ""} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bagian Bawah */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <div className="bg-slate-200/50 px-4 py-2 rounded-xl">
            <span className="text-sm font-bold text-slate-600">
              Total : {isBalanceHidden ? "Rp ••••••••" : new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(totalBalance)}
            </span>
          </div>
          <button 
            onClick={onTransferClick}
            className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer"
          >
            <RefreshCw size={18} />
            <span>Pindah Saldo</span>
          </button>
        </div>

        {/* Tombol Tambah Tabungan */}
        <button 
          onClick={onAddClick}
          className="w-full bg-primary text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-6 cursor-pointer"
        >
          <Plus size={20} />
          <span>Tambah Tabungan</span>
        </button>

        {/* Overlay Konfirmasi Hapus Dompet */}
        {walletToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-3xl p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-red-100/50 transform transition-all animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
              {/* Latar Belakang Abstrak Merah */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-red-100">
                  <AlertTriangle size={36} strokeWidth={1.5} className="drop-shadow-sm" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">Hapus Dompet?</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed px-2">
                  Semua transaksi yang ada di dompet ini akan terhapus selamanya. Pastikan tidak ada data penting ya!
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      onDeleteWalletClick?.(walletToDelete);
                      setWalletToDelete(null);
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 transform hover:-translate-y-0.5 text-sm cursor-pointer"
                  >
                    Ya, Hapus Permanen
                  </button>
                  <button 
                    onClick={() => setWalletToDelete(null)}
                    className="w-full py-4 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                  >
                    Batal, Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
