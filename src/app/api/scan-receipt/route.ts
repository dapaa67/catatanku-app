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
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Gambar tidak valid" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            storeName: {
              type: SchemaType.STRING,
              description: "Nama toko atau merchant"
            },
            items: {
              type: SchemaType.ARRAY,
              description: "Daftar barang yang dibeli",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: {
                    type: SchemaType.STRING,
                    description: "Nama barang bersih yang diformat rapi (Title Case), tambahkan (xJumlah) jika lebih dari 1 (contoh: Piattos Sapi Panggang 68g (x2))"
                  },
                  amount: {
                    type: SchemaType.NUMBER,
                    description: "Total harga untuk barang ini (angka bulat)"
                  }
                },
                required: ["name", "amount"]
              }
            }
          },
          required: ["storeName", "items"]
        }
      }
    });

    const prompt = `Anda adalah ahli ekstraksi data struk belanja.
Tugas Anda:
1. Temukan nama toko/merchant yang valid (Format rapi/Title Case).
2. Ekstrak daftar barang belanjaan yang dibeli (abaikan baris alamat, kasir, pajak, kembalian, subtotal, diskon).
3. Bersihkan nama barang menjadi huruf Title Case yang enak dibaca (contoh: "PIATTOS SAPI PNG 68G" menjadi "Piattos Sapi Panggang 68g").
4. JANGAN masukkan harga satuan ke dalam nama barang. JIKA kuantitas lebih dari 1, tambahkan di belakang nama (contoh: " (x2)").
5. Masukkan harga total barang tersebut ke dalam 'amount' sebagai angka.
6. Abaikan item yang sangat murah di bawah Rp 500 (seperti kantong plastik).`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);

  } catch (error: unknown) {
    console.error("Gemini Scan Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal memproses gambar: " + message },
      { status: 500 }
    );
  }
}
