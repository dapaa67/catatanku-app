import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Inisialisasi Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: "Gemini API Key tidak ditemukan di server" }, { status: 500 });
    }

    const body = await req.json();
    const { deskripsi_transaksi } = body;

    if (!deskripsi_transaksi) {
      return NextResponse.json({ error: "Deskripsi transaksi tidak valid" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            hasil: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  kategori: {
                    type: SchemaType.STRING,
                    description: "Kategori transaksi"
                  }
                },
                required: ["kategori"]
              }
            }
          },
          required: ["hasil"]
        }
      }
    });

    const prompt = `Klasifikasikan deskripsi transaksi ini: "${deskripsi_transaksi}". 
Pilih salah satu dari kategori berikut yang paling cocok:
- Konsumsi: Untuk makanan, minuman, restoran, kafe, bahan masakan, jajanan (contoh: Solaria, KFC, Nasi Goreng, Kopi).
- Belanja: Untuk pembelian barang fisik seperti pakaian, elektronik, perabotan, skincare, barang rumah tangga (selain makanan/minuman).
- Transportasi: Untuk bensin, parkir, tol, tiket pesawat/kereta, ojek online (Gojek/Grab), taksi.
- Tagihan: Untuk listrik, air, internet, telepon, asuransi, langganan bulanan.
- Tempat Tinggal: Untuk sewa rumah, kos, perbaikan rumah.
- Kesehatan: Untuk obat, dokter, rumah sakit, klinik.
- Hiburan: Untuk bioskop, konser, game, rekreasi, streaming.
- Lain-lain: Untuk pengeluaran lainnya.
- Pendapatan: Untuk gaji, bonus, hasil usaha.
- Investasi: Untuk pembelian saham, reksadana, emas.

Pilih tepat satu nama kategori dengan kapitalisasi yang benar dari daftar di atas (Konsumsi, Belanja, Transportasi, Tagihan, Tempat Tinggal, Kesehatan, Hiburan, Lain-lain, Pendapatan, Investasi).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini Classify Error:", error);
    return NextResponse.json(
      { error: "Gagal mengklasifikasi transaksi: " + error.message },
      { status: 500 }
    );
  }
}