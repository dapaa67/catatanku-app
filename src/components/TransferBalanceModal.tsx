import { useState, useEffect } from "react";
import { ArrowDown, X } from "lucide-react";
import { Wallet } from "./SelectWalletModal";

interface TransferBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onTransfer: (fromId: string, toId: string, amount: number) => void;
}

export function TransferBalanceModal({ isOpen, onClose, wallets, onTransfer }: TransferBalanceModalProps) {
  const [fromWalletId, setFromWalletId] = useState<string>("");
  const [toWalletId, setToWalletId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFromWalletId(wallets.length > 0 ? wallets[0].id : "");
      setToWalletId(wallets.length > 1 ? wallets[1].id : "");
      setAmount("");
      setError("");
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const fromWallet = wallets.find(w => w.id === fromWalletId);

  const handleTransferAll = () => {
    if (fromWallet) {
      setAmount(fromWallet.balance.toString());
    }
  };

  const handleSubmit = () => {
    setError("");
    if (!fromWalletId || !toWalletId || !amount) {
      setError("Harap isi semua field.");
      return;
    }
    if (fromWalletId === toWalletId) {
      setError("Dompet asal dan tujuan tidak boleh sama.");
      return;
    }
    const transferAmount = Number(amount);
    if (transferAmount <= 0) {
      setError("Jumlah transfer harus lebih besar dari 0.");
      return;
    }
    if (fromWallet && transferAmount > fromWallet.balance) {
      setError("Saldo tidak mencukupi.");
      return;
    }

    onTransfer(fromWalletId, toWalletId, transferAmount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-lg relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-primary text-center mb-6">Pindah Saldo</h2>

        <div className="flex flex-col gap-4">
          {/* Dari Dompet */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Dari</label>
            <select 
              value={fromWalletId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="" disabled>Pilih dompet asal</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {fromWallet && (
              <p className="text-xs text-slate-500 mt-2">
                Saldo sisa: <span className="font-semibold text-emerald-500">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(fromWallet.balance)}
                </span>
              </p>
            )}
          </div>

          <div className="flex justify-center -my-1 relative z-10">
            <div className="bg-slate-100 p-2 rounded-full text-slate-400 border-4 border-white">
              <ArrowDown size={20} />
            </div>
          </div>

          {/* Ke Dompet */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ke</label>
            <select 
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="" disabled>Pilih dompet tujuan</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Jumlah Saldo */}
          <div className="mt-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nominal Transfer</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-semibold">Rp</span>
              <input 
                type="number" 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex justify-start mt-2">
              <button 
                onClick={handleTransferAll}
                className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
              >
                Pindahkan Semua
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}
        </div>

        {/* Tombol Aksi Bawah */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3.5 rounded-full font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
          >
            Konfirmasi Pindah
          </button>
        </div>
      </div>
    </div>
  );
}
