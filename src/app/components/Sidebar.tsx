"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Target,
  Settings,
  NotebookPen,
  LogOut, // Tambahin icon logout biar makin mirip figma
  ChevronDown,
  ChevronRight,
  List,
  Menu,
  X
} from "lucide-react";

import { Plus } from "lucide-react"; // Import icon Plus yang dibutuhkan

const navItems = [
  { label: "Home",             href: "/dashboard",        icon: Home },
  { label: "Tambah Transaksi", href: "/transaksi/tambah", icon: Plus },
  { label: "Riwayat Transaksi",href: "/transaksi",        icon: List },
  { label: "Analisis",         href: "/analisis",         icon: PieChart        },
  { label: "Tabungan",         href: "/tabungan",         icon: Target          },
  { label: "AI Assistant",     href: "/ai-assistant",     icon: NotebookPen     },
  { label: "Pengaturan",       href: "/pengaturan",       icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isTambahOpen, setIsTambahOpen] = useState(pathname.startsWith("/transaksi/tambah"));
  const [userProfile, setUserProfile] = useState<{name: string, email: string} | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tutup menu mobile setiap kali route berubah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const email = user.email || "";
          const name = user.user_metadata?.name || email.split("@")[0] || "User";
          setUserProfile({ name, email });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Mobile Top Header (Hanya muncul di HP) */}
      <div className="lg:hidden flex items-center justify-between bg-primary p-4 text-white sticky top-0 z-40 shadow-sm w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg">
            <NotebookPen className="text-primary w-5 h-5" />
          </div>
          <span className="text-lg font-bold italic">CatatanKu</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay background saat drawer terbuka di hp */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Utama */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen overflow-y-auto flex flex-col w-64 bg-primary text-white px-4 py-6 z-50 transition-transform duration-300 ease-in-out flex-shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        
        {/* Header Logo (Desktop) & Close Button (Mobile) */}
        <div className="flex items-center justify-between px-2 mb-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg">
               <NotebookPen className="text-primary w-6 h-6" />
            </div>
            <span className="text-xl font-bold italic">
              CatatanKu
            </span>
          </Link>
        </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          // Khusus untuk Tambah Transaksi yang sekarang punya submenu
          if (href === "/transaksi/tambah") {
            const isParentActive = pathname.startsWith("/transaksi/tambah");
            
            return (
              <div key="tambah-transaksi" className="flex flex-col gap-1">
                <button
                  onClick={() => setIsTambahOpen(!isTambahOpen)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all w-full cursor-pointer ${
                    isParentActive
                      ? "text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {label}
                  </div>
                </button>
                
                {/* Submenu */}
                <div className={`flex flex-col pl-12 gap-1 mt-1 overflow-hidden transition-all duration-300 ease-in-out ${isTambahOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <Link
                    href="/transaksi/tambah/manual"
                    className={`block py-2 px-3 -ml-3 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/transaksi/tambah/manual"
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Manual
                  </Link>
                  <Link
                    href="/transaksi/tambah/scan"
                    className={`block py-2 px-3 -ml-3 rounded-lg text-sm font-medium transition-colors ${
                      pathname === "/transaksi/tambah/scan"
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Scan Struk
                  </Link>
                </div>
              </div>
            );
          }

          const isActive = pathname === href || (pathname === "/" && href === "/dashboard");
          
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? "bg-white/20 shadow-inner"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer User: Disesuaikan biar gelap kayak Figma */}
      <div className="flex items-center justify-between px-2 pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-primary font-bold uppercase shrink-0">
              {userProfile ? userProfile.name.charAt(0) : "U"}
            </div>
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-semibold truncate">{userProfile ? userProfile.name : "Loading..."}</span>
              <span className="text-[10px] text-white/50 truncate" title={userProfile?.email}>{userProfile ? userProfile.email : "loading..."}</span>
            </div>
        </div>
        <button onClick={handleLogout} className="text-white/50 hover:text-red-400 transition-colors shrink-0 ml-2">
            <LogOut size={18} />
        </button>
      </div>

    </aside>
    </>
  );
}