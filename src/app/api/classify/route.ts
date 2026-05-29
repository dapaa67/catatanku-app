import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deskripsi_transaksi } = body;

    if (!deskripsi_transaksi) {
      return NextResponse.json({ error: "Deskripsi transaksi tidak valid" }, { status: 400 });
    }

    // Call custom FastAPI backend
    const response = await fetch("https://yobby15-catatanku-fastapi.hf.space/api/predict/kategori", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deskripsi_transaksi }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const parsedData = await response.json();
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Custom AI Classify Error:", error);
    return NextResponse.json(
      { error: "Gagal mengklasifikasi transaksi: " + error.message },
      { status: 500 }
    );
  }
}