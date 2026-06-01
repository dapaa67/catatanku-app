import Sidebar from "@/app/components/Sidebar";

export default function TabunganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
