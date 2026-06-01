import Sidebar from "@/app/components/Sidebar";

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
