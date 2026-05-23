"use client";

import { Sparkles, Bot } from "lucide-react";
import Link from "next/link";

export default function AIAssistantPage() {
  return (
    <div className="w-full h-[calc(100vh-3rem)] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex flex-col items-center max-w-md text-center px-6">
        
        {/* Icon Container */}
        <div className="relative mb-6">
          <div className="bg-primary/10 p-5 rounded-full flex items-center justify-center">
            <Bot className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          AI Assistant CatatanKu
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Fitur ini sedang dalam tahap pengembangan. Segera hadir untuk membantu Anda mengelola keuangan jadi lebih pintar dan otomatis.
        </p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 mb-6">
          Akan Segera Hadir
        </div>

        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
