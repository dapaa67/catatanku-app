import { useState, useRef, useEffect } from "react";
import { ImagePlus } from "lucide-react";
import { Wallet } from "./SelectWalletModal";

export interface NewWalletData {
  name: string;
  balance: number;
  color: string;
  imageUrl?: string;
}

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewWalletData) => void;
  initialData?: Wallet | null;
}

const PREDEFINED_COLORS = [
  "#00A3B5", // Teal
  "#E53935", // Merah
  "#546E7A", // Biru-abu
  "#212121", // Hitam
  "#FFB300", // Kuning
  "#00C853", // Hijau
];

export function AddWalletModal({ isOpen, onClose, onSave, initialData }: AddWalletModalProps) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | undefined>();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efek untuk mengisi form jika ada initialData (Edit Mode)
  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name);
      setBalance(initialData.balance.toString());
      setSelectedColor(initialData.color);
      setSelectedImageUrl(initialData.imageUrl);
    } else if (isOpen) {
      // Reset jika mode Tambah
      setName("");
      setBalance("");
      setSelectedColor(PREDEFINED_COLORS[0]);
      setSelectedImageUrl(undefined);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageUrl(imageUrl);
      setSelectedColor(""); // Reset warna kalau pake custom image
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Nama tabungan tidak boleh kosong");
      return;
    }
    
    onSave({
      name,
      balance: balance === "" ? 0 : Number(balance),
      color: selectedColor || "#00A3B5", // Fallback teal
      imageUrl: selectedImageUrl
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-lg">
        
        {/* Header Modal */}
        <h2 className="text-xl font-bold text-primary text-center mb-6">
          {initialData ? 'Edit Tabungan' : 'Tambah Tabungan'}
        </h2>
        
        {/* Form Body */}
        <div className="flex flex-col gap-5">
          {/* Input Nama */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Tabungan</label>
            <input 
              type="text" 
              placeholder="Contoh : BCA, Cash, Dana" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Color Picker / Background Tema */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Background Tema</label>
            <div className="grid grid-cols-7 gap-3">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setSelectedImageUrl(undefined);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${selectedColor === color && !selectedImageUrl ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              
              {/* Custom Image Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:text-primary hover:border-primary transition-all overflow-hidden ${selectedImageUrl ? 'ring-2 ring-offset-2 ring-primary scale-110 border-solid border-transparent' : ''}`}
              >
                {selectedImageUrl ? (
                  <img src={selectedImageUrl} alt="Custom bg" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold">Custom</span>
                )}
              </button>
            </div>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {/* Input Saldo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Saldo Awal</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-semibold">Rp</span>
              <input 
                type="number" 
                placeholder="0" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Saldo awal sebelum memulai catat transaksi</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-full font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
          >
            Simpan
          </button>
        </div>

      </div>
    </div>
  );
}
