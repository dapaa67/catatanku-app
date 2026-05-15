import { Pencil, Eye, EyeOff } from "lucide-react";

interface WalletCardProps {
  name: string;
  balance: number;
  color: string;
  imageUrl?: string;
  isBalanceHidden?: boolean;
  onToggleHideBalance?: () => void;
  onEditClick?: () => void;
}

export function WalletCard({ name, balance, color, imageUrl, isBalanceHidden, onToggleHideBalance, onEditClick }: WalletCardProps) {
  return (
    <div 
      className="rounded-3xl p-6 text-white shadow-lg w-full min-h-[240px] flex flex-col transition-colors duration-500 bg-cover bg-center relative overflow-hidden"
      style={{ 
        backgroundColor: color,
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined 
      }}
    >
      {/* Dark overlay for readability if using image */}
      {imageUrl && <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>}

      <div className="flex justify-between items-start relative z-10">
        {/* Kiri Atas: Nama Dompet & Icon Pensil */}
        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
          <span className="text-sm font-medium">{name}</span>
          <button 
            onClick={onEditClick}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
        </div>

        {/* Kanan Atas: Icon Mata */}
        <button 
          onClick={onToggleHideBalance}
          className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm cursor-pointer"
        >
          {isBalanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Tengah: Saldo */}
      <div className="flex-1 flex items-center justify-center mt-4 relative z-10">
        <h3 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
          {isBalanceHidden ? "Rp ••••••••" : new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(balance)}
        </h3>
      </div>
    </div>
  );
}
