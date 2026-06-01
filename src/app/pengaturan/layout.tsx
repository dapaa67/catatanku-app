import Sidebar from "@/app/components/Sidebar";

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
