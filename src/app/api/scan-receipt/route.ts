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
                    description: "Nama barang lengkap dengan detail jumlah/satuan (contoh: PIATTOS SAPI PNG 68G 2 11200)"
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
1. Temukan nama toko/merchant yang valid.
2. Ekstrak daftar barang belanjaan yang dibeli (hanya barang, abaikan baris alamat, nama kasir, nomor struk, pajak, kembalian, diskon, subtotal, atau total).
3. Untuk setiap barang, gabungkan nama barang dengan kuantitas dan harga satuan jika ada ke dalam string 'name'.
4. Masukkan harga total barang tersebut (bukan harga satuan) ke dalam 'amount' sebagai angka.
5. Abaikan item yang sangat murah di bawah Rp 500 (seperti kantong plastik).`;

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

  } catch (error: any) {
    console.error("Gemini Scan Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses gambar: " + error.message },
      { status: 500 }
    );
  }
}
