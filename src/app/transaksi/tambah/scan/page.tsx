"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Receipt, UploadCloud, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

// Helper to generate UUID
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function ScanStrukPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await processImage(file);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // 1. Convert image to base64
      const buffer = await file.arrayBuffer();
      const base64Str = Buffer.from(buffer).toString('base64');
      const mimeType = file.type;

      // 2. Call backend Gemini API
      // Since it's server processing, just set progress to 50% immediately to show it's working
      setProgress(50);
      
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Str,
          mimeType: mimeType
        })
      });
      
      setProgress(90);

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Gagal menghubungi AI Scanner");
      }

      const data = await response.json();
      
      const storeName = data.storeName || "Merchant Tidak Diketahui";
      const parsedItems = data.items || [];
      
      setProgress(100);
      
      // Tanggal dan Jam
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      
      // 3. Buat Draft Transaksi (Multiple)
      let newDrafts = parsedItems.map((item: { name: string, amount: number }) => ({
        id: generateId(),
        originalInput: `Scan struk: ${item.name} Rp ${item.amount}`,
        originalCategory: "Belanja",
        category: "Belanja",
        type: "pengeluaran" as const,
        amount: item.amount,
        name: `${storeName} - ${item.name}`,
        date: dateStr,
        time: timeStr,
        isLoading: false,
      }));

      // 3.5. AI Category Prediction
      await Promise.all(
        newDrafts.map(async (draft: any) => {
          try {
            const res = await fetch("https://yobby15-catatanku-fastapi.hf.space/api/predict/kategori", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deskripsi_transaksi: draft.name })
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.hasil && data.hasil.length > 0) {
                const predictedKategori = data.hasil[0].kategori;
                draft.category = predictedKategori;
                draft.originalCategory = predictedKategori;
              }
            }
          } catch (err) {
            console.error("Gagal memprediksi kategori untuk:", draft.name);
          }
        })
      );
      
      // 4. Simpan ke Local Storage Manual Drafts
      const savedStr = localStorage.getItem("catatanku_manual_drafts");
      let drafts: any[] = [];
      if (savedStr) {
        try { drafts = JSON.parse(savedStr); } catch(e) {}
      }
      
      drafts.push(...newDrafts);
      localStorage.setItem("catatanku_manual_drafts", JSON.stringify(drafts));
      
      // 5. Redirect
      router.push("/transaksi/tambah/manual");
      
    } catch (err) {
      console.error("Gagal OCR:", err);
      alert("Gagal membaca struk. Pastikan foto jelas dan terang.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* File Inputs (Hidden) */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
      />

      {/* Header Panel */}
      <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-white relative shadow-md bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/20 p-3 rounded-2xl mb-4 backdrop-blur-sm border border-white/30 shadow-inner">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            AI Scan Struk 
          </h1>
          <p className="text-sm text-white/90 max-w-md text-center leading-relaxed">
            Punya struk belanja? Foto aja! AI kami akan otomatis mendeteksi nama toko dan total belanjaanmu tanpa perlu ngetik manual.
          </p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Upload Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col min-h-[400px]">
          <h2 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Area Upload</h2>
          
          <div 
            className={`flex-1 border-2 border-dashed rounded-3xl transition-colors flex flex-col items-center justify-center p-10 group relative overflow-hidden ${isProcessing ? 'border-primary bg-primary/5' : 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center z-10 text-primary">
                <Loader2 className="w-16 h-16 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">Membaca Struk...</h3>
                <p className="text-sm text-primary/70 font-medium">Proses: {progress}%</p>
                <div className="w-48 h-2 bg-primary/20 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">Tarik & Lepas Foto Di Sini</h3>
                <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
                  Mendukung format JPG, PNG, atau ambil foto langsung dari kamera HP kamu
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center relative z-10" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>Pilih Galeri</span>
                  </button>
                  
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-full hover:bg-primary-dark transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Buka Kamera</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tips Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Receipt className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Tips Scan Optimal</h2>
            </div>
            
            <ul className="space-y-5">
              <li className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Foto Jelas & Rata</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pastikan struk tidak terlipat, rata, dan tulisan terbaca dengan jelas.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Total Harga Terlihat</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Bagian paling krusial adalah angka "Total" atau "Grand Total".</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Pencahayaan Terang</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Gunakan lampu ruangan yang terang dan hindari bayangan pada struk.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Info Card - Simplified */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm mt-auto">
            <div className="bg-white p-2.5 rounded-xl text-teal-600 shadow-sm border border-slate-100 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                Privasi Dijamin Aman
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Foto struk kamu cuma numpang lewat untuk dibaca. Setelah itu otomatis terhapus dan tidak disimpan di server.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
