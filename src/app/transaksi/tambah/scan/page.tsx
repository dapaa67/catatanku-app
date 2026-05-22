"use client";

import { Camera, Image as ImageIcon, Receipt, UploadCloud, Sparkles, CheckCircle2 } from "lucide-react";

export default function ScanStrukPage() {
  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Panel */}
      <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-white relative shadow-md bg-gradient-to-r from-[#0f9a95] to-teal-500 overflow-hidden">
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
          <p className="text-sm text-teal-50 max-w-md text-center leading-relaxed">
            Punya struk belanja? Foto aja! AI kami akan otomatis mendeteksi nama toko, kategori, dan total belanjaanmu tanpa perlu ngetik manual.
          </p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Upload Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col min-h-[400px]">
          <h2 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Area Upload</h2>
          
          <div className="flex-1 border-2 border-dashed border-teal-200 rounded-3xl bg-teal-50/50 hover:bg-teal-50 transition-colors flex flex-col items-center justify-center p-10 group cursor-pointer relative overflow-hidden">
            
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-teal-100 mb-5 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-10 h-10 text-[#0f9a95]" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tarik & Lepas Foto Di Sini</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
              Mendukung format JPG, PNG, atau ambil foto langsung dari kamera HP kamu
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center relative z-10">
              <button className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
                <ImageIcon className="w-5 h-5 text-[#0f9a95]" />
                <span>Pilih Galeri</span>
              </button>
              
              <button className="flex items-center justify-center gap-2 bg-[#0f9a95] text-white font-bold px-6 py-3.5 rounded-full hover:bg-teal-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">
                <Camera className="w-5 h-5" />
                <span>Buka Kamera</span>
              </button>
            </div>
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
                <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Foto Jelas & Rata</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pastikan struk tidak terlipat, rata, dan tulisan terbaca dengan jelas.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Total Harga Terlihat</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Bagian paling krusial adalah angka "Total" atau "Grand Total".</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Pencahayaan Terang</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Gunakan lampu ruangan yang terang dan hindari bayangan pada struk.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Info Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex-1 flex flex-col justify-center shadow-lg">
            <div className="absolute -right-4 -bottom-4 text-white/5">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Keunggulan Fitur Ini</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Teknologi AI kami dapat otomatis mengklasifikasikan pengeluaran. Contoh: Struk "Indomaret" otomatis jadi kategori "Belanja".
              </p>
              <div className="text-xs font-bold inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                AI Ready
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
