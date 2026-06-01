"use client";

import { useState } from "react";
import Image from "next/image";
import { NotebookPen } from "lucide-react";

const slides = [
  {
    cardTitle: "Pantau pengeluaranmu tanpa ribet.",
    cardDesc: "Catat pengeluaran secara manual atau scan struk dalam hitungan detik.",
    bottomTitle: "Kendalikan pengeluaranmu sepenuhnya.",
    bottomDesc: "Kelola pengeluaran, scan struk seketika, dan capai target tabunganmu.",
  },
  {
    cardTitle: "Kelola keuanganmu lebih mudah.",
    cardDesc: "Pantau pemasukan dan pengeluaran dari semua dompetmu dalam satu tempat.",
    bottomTitle: "Raih target tabunganmu lebih cepat.",
    bottomDesc: "Rencanakan tabungan harian, mingguan, atau bulanan dengan mudah.",
  },
  {
    cardTitle: "Scan struk, catat otomatis.",
    cardDesc: "Foto struk belanjamu dan biarkan AI yang mengklasifikasikan pengeluaranmu.",
    bottomTitle: "Analisis keuanganmu secara mendalam.",
    bottomDesc: "Lihat laporan pengeluaran dan tren keuanganmu setiap bulan.",
  },
];

export default function AuthLeftPanel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  return (
    <div className="hidden lg:flex w-[45%] h-screen bg-primary flex-col justify-center items-center py-10 px-8 relative flex-shrink-0">
      
      {/* Wadah utama pembatas lebar konten */}
      <div className="w-full max-w-[460px] flex flex-col items-center">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-14">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm">
            <NotebookPen className="text-primary w-8 h-8" />
          </div>
          <span className="text-white text-[15px] font-semibold tracking-wide">Catatanku</span>
        </div>

        {/* Kartu Putih Utama */}
        <div className="bg-white rounded-3xl w-full aspect-[16/10] max-h-[280px] shadow-xl relative overflow-hidden flex items-center p-8 mb-14">
          
          {/* Teks Kiri */}
          <div className="flex flex-col justify-center w-[60%] z-10 relative">
            <h3 className="text-primary text-[28px] font-extrabold leading-[1.2] mb-3 tracking-tight pr-2">
              {slide.cardTitle}
            </h3>
            <p className="text-slate-500 text-[14px] leading-relaxed">
              {slide.cardDesc}
            </p>
          </div>
          
          {/* Ilustrasi Hiasan Kanan */}
          <div className="absolute right-0 bottom-4 w-[180px] h-[180px]">
            <Image
              src="/wallet-illustration.png"
              alt="Ilustrasi dompet"
              fill
              className="object-contain object-right"
              loading="eager"
            />
          </div>
        </div>

        {/* Teks Bawah */}
        <div className="text-center text-white w-full mb-12">
          <h2 className="text-[28px] font-bold mb-3 leading-tight tracking-tight">
            {slide.bottomTitle}
          </h2>
          <p className="text-white/80 text-[15.5px] leading-[1.6] max-w-[380px] mx-auto">
            {slide.bottomDesc}
          </p>
        </div>

        {/* Navigasi Titik */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none w-6 flex items-center justify-center"
            aria-label="Sebelumnya"
          >
            ‹
          </button>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeSlide ? "bg-white w-6" : "bg-white/40 w-1.5"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <button
            onClick={() => setActiveSlide((s) => Math.min(slides.length - 1, s + 1))}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none w-6 flex items-center justify-center"
            aria-label="Berikutnya"
          >
            ›
          </button>
        </div>

      </div>
    </div>
  );
}
