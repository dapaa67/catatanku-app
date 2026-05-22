import { redirect } from "next/navigation";

export default function TransaksiPage() {
  // Untuk sementara langsung diarahkan ke halaman tambah transaksi manual
  redirect("/transaksi/tambah/manual");
}
