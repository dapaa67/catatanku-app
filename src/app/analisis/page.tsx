"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

interface SummaryData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingRate: number;
  totalTransactions: number;
  averageExpense: number;
  topExpenseCategories?: { category: string, amount: number, percentage: number }[];
  topIncomeCategories?: { category: string, amount: number, percentage: number }[];
  trendLast6Months?: { month: string, year: number, income: number, expense: number }[];
}

export default function AnalisisPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/wallets")
      .then(res => res.json())
      .then(data => {
        if (data.data) setWallets(data.data);
      })
      .catch(err => console.error("Gagal mengambil dompet", err));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const url = `/api/summary?month=${month}&year=${year}${selectedWalletId !== "all" ? `&walletId=${selectedWalletId}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = await res.json();
      setSummary(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedWalletId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  const monthName = selectedDate.toLocaleString('id-ID', { month: 'long' });
  const yearStr = selectedDate.getFullYear();

  const monthsList = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="flex flex-col gap-6 w-full pb-10 text-slate-800">
      {/* Bagian Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1 text-slate-800">Analisis Keuangan</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Ringkasan dan tren keuangan kamu</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Pilihan Dompet */}
          <div className="relative z-20 w-full sm:w-auto">
            <div 
              className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-primary/30 rounded-full px-5 py-2.5 shadow-sm text-slate-700 cursor-pointer hover:border-primary hover:text-primary transition-colors select-none w-full"
              onClick={() => {
                setIsWalletPickerOpen(!isWalletPickerOpen);
                setIsMonthPickerOpen(false);
              }}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-bold">
                {selectedWalletId === "all" ? "Semua Dompet" : wallets.find(w => w.id === selectedWalletId)?.name || "Dompet"}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isWalletPickerOpen ? 'rotate-180' : ''}`} />
            </div>

            {isWalletPickerOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 w-48 animate-in fade-in zoom-in duration-200 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedWalletId("all");
                    setIsWalletPickerOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${selectedWalletId === 'all' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Semua Dompet
                </button>
                {wallets.map(wallet => (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      setSelectedWalletId(wallet.id);
                      setIsWalletPickerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${selectedWalletId === wallet.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }}></div>
                    {wallet.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pilihan Bulan */}
          <div className="relative z-10 w-full sm:w-auto">
            <div 
              className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-primary/30 rounded-full px-5 py-2.5 shadow-sm text-slate-700 cursor-pointer hover:border-primary hover:text-primary transition-colors select-none w-full"
              onClick={() => {
                setPickerYear(selectedDate.getFullYear());
                setIsMonthPickerOpen(!isMonthPickerOpen);
                setIsWalletPickerOpen(false);
              }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-bold">{monthName} {yearStr}</span>
            </div>

            {isMonthPickerOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-64 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4 px-2">
                   <button onClick={() => setPickerYear(y => y - 1)} className="hover:bg-slate-100 p-1 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
                   <span className="font-bold text-slate-800">{pickerYear}</span>
                   <button onClick={() => setPickerYear(y => y + 1)} className="hover:bg-slate-100 p-1 rounded-md"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {monthsList.map((m, idx) => (
                      <button 
                        key={m}
                        onClick={() => {
                          setSelectedDate(new Date(pickerYear, idx, 1));
                          setIsMonthPickerOpen(false);
                        }}
                        className={`text-xs py-2 rounded-lg font-bold transition-colors ${
                          selectedDate.getMonth() === idx && selectedDate.getFullYear() === pickerYear
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.substring(0, 3)}
                      </button>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kartu Informasi Atas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pemasukan */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-bold text-slate-700">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-green-500 mb-3">{isLoading ? "..." : formatRupiah(summary?.totalIncome || 0)}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Bulan ini</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-bold text-slate-700">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-red-500 mb-3">{isLoading ? "..." : formatRupiah(summary?.totalExpense || 0)}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Bulan ini</span>
            </div>
          </div>
        </div>

        {/* Sisa Saldo */}
        <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-bold text-slate-700">Total Saldo</span>
            <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">{isLoading ? "..." : formatRupiah(summary?.totalBalance || 0)}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {selectedWalletId === 'all' ? 'di seluruh dompet' : `di dompet ${wallets.find(w => w.id === selectedWalletId)?.name || ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Tren Keuangan */}
      <div className="bg-white border border-primary/30 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="font-bold text-slate-800 mb-1">Tren Keuangan</h3>
            <p className="text-xs font-medium text-slate-500">Perbandingan pemasukan & pengeluaran 6 bulan terakhir</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1.5 bg-[#10b981] rounded-full"></div>
              <span className="text-xs font-bold text-slate-600">Pemasukan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1.5 bg-[#ef4444] rounded-full"></div>
              <span className="text-xs font-bold text-slate-600">Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Grafik Bar Kustom */}
        <div className="relative h-64 flex mt-4 mb-8">
          {(() => {
            const chartData = summary?.trendLast6Months || [];
            const maxVal = chartData.reduce((max, d) => Math.max(max, d.income, d.expense), 0) || 100;
            const formatY = (val: number) => {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + "Jt";
              if (val >= 1000) return (val / 1000).toFixed(0) + "K";
              return val.toString();
            };

            return (
              <>
                {/* Sumbu Y */}
                <div className="flex flex-col justify-between text-xs font-bold text-slate-400 h-full pr-4 pb-6 w-12 items-end">
                  <span>{formatY(maxVal)}</span>
                  <span>{formatY(maxVal * 0.75)}</span>
                  <span>{formatY(maxVal * 0.5)}</span>
                  <span>{formatY(maxVal * 0.25)}</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative border-b border-slate-300">
                  {/* Garis Latar */}
                  <div className="absolute inset-0 flex flex-col justify-between pb-6">
                    <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                    <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                    <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                    <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                  </div>

                  {/* Wadah Grafik Bar */}
                  <div className="absolute inset-0 pb-6 flex justify-around items-end z-10 px-2 sm:px-6">
                    {chartData.map((data, idx) => {
                      const incomeHeight = maxVal > 0 ? (data.income / maxVal) * 100 : 0;
                      const expenseHeight = maxVal > 0 ? (data.expense / maxVal) * 100 : 0;

                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group w-full max-w-[60px]">
                          <div className="flex items-end gap-1 sm:gap-2 h-full w-full justify-center">
                            {/* Pemasukan Bar */}
                            <div 
                              className="w-3 sm:w-6 bg-[#10b981] rounded-t-sm transition-all duration-500 relative group"
                              style={{ height: `${incomeHeight}%` }}
                            >
                              <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity">
                                {formatRupiah(data.income)}
                              </div>
                            </div>
                            {/* Pengeluaran Bar */}
                            <div 
                              className="w-3 sm:w-6 bg-[#ef4444] rounded-t-sm transition-all duration-500 relative group"
                              style={{ height: `${expenseHeight}%` }}
                            >
                              <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity">
                                {formatRupiah(data.expense)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Sumbu X */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-around px-2 sm:px-6 transform translate-y-full pt-3 text-xs md:text-sm font-bold text-slate-500">
                    {chartData.map((data, idx) => (
                      <span key={idx} className="text-center w-full max-w-[60px] truncate sm:overflow-visible">
                        <span className="sm:hidden">{data.month.substring(0, 3)}</span>
                        <span className="hidden sm:inline">{data.month}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Kategori Terbesar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Pengeluaran */}
        <div className="bg-white border border-primary/30 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 border-b sm:border-0 border-slate-100 pb-4 sm:pb-0">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Top 5 Kategori Pengeluaran</h3>
            <span className="text-[10px] md:text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full">{monthName} {yearStr}</span>
          </div>
          <div className="flex flex-col gap-6">
            {summary?.topExpenseCategories?.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="font-bold text-slate-700 truncate mr-2">{item.category}</span>
                  <div className="flex items-center gap-3 md:gap-6 shrink-0">
                    <span className="font-bold text-slate-800">{formatRupiah(item.amount)}</span>
                    <span className="w-8 text-right font-bold text-slate-500">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-600 rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!summary?.topExpenseCategories || summary.topExpenseCategories.length === 0) && (
              <div className="text-sm text-slate-500 italic text-center py-4">Belum ada data pengeluaran.</div>
            )}
          </div>
        </div>

        {/* Pemasukan */}
        <div className="bg-white border border-primary/30 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 border-b sm:border-0 border-slate-100 pb-4 sm:pb-0">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Top 5 Kategori Pemasukan</h3>
            <span className="text-[10px] md:text-xs font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full">{monthName} {yearStr}</span>
          </div>
          <div className="flex flex-col gap-6">
            {summary?.topIncomeCategories?.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="font-bold text-slate-700 truncate mr-2">{item.category}</span>
                  <div className="flex items-center gap-3 md:gap-6 shrink-0">
                    <span className="font-bold text-slate-800">{formatRupiah(item.amount)}</span>
                    <span className="w-8 text-right font-bold text-slate-500">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/80 rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!summary?.topIncomeCategories || summary.topIncomeCategories.length === 0) && (
              <div className="text-sm text-slate-500 italic text-center py-4">Belum ada data pemasukan.</div>
            )}
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div className="bg-white border border-primary/30 rounded-3xl p-6 shadow-sm mt-2">
        <h3 className="font-bold text-slate-800 mb-6">Statistik</h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-600">Total Transaksi</span>
            <span className="text-sm font-bold text-slate-800">{isLoading ? "..." : summary?.totalTransactions || 0}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-600">Rata - rata Pengeluaran</span>
            <span className="text-sm font-bold text-slate-800">{isLoading ? "..." : formatRupiah(summary?.averageExpense || 0)}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-sm font-bold text-slate-600">Saving Rate</span>
            <span className="text-sm font-bold text-slate-800">{isLoading ? "..." : `${summary?.savingRate || 0} %`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
