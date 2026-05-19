import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59)

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id }
  })
  const walletIds = wallets.map(w => w.id)
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0)

  const txThisMonth = await prisma.transaction.findMany({
    where: { walletId: { in: walletIds }, date: { gte: from, lte: to } }
  })

  const totalIncome = txThisMonth
    .filter(t => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalExpense = txThisMonth
    .filter(t => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0)

  const expenseCategoryMap: Record<string, number> = {}
  txThisMonth
    .filter(t => t.type === "EXPENSE")
    .forEach(t => {
      expenseCategoryMap[t.category] = (expenseCategoryMap[t.category] ?? 0) + Number(t.amount)
    })

  const incomeCategoryMap: Record<string, number> = {}
  txThisMonth
    .filter(t => t.type === "INCOME")
    .forEach(t => {
      incomeCategoryMap[t.category] = (incomeCategoryMap[t.category] ?? 0) + Number(t.amount)
    })

  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }))

  const topIncomeCategories = Object.entries(incomeCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
    }))

  const last6Months = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      const mFrom = new Date(d.getFullYear(), d.getMonth(), 1)
      const mTo = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      return prisma.transaction.findMany({
        where: { walletId: { in: walletIds }, date: { gte: mFrom, lte: mTo } }
      }).then(txs => ({
        month: d.toLocaleString("id-ID", { month: "short" }),
        year: d.getFullYear(),
        income: txs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0),
        expense: txs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)
      }))
    })
  )

  const savingRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
    : 0

  return NextResponse.json({
    data: {
      totalBalance,
      totalIncome,
      totalExpense,
      savingRate,
      topExpenseCategories,
      topIncomeCategories,
      trendLast6Months: last6Months.reverse(),
      totalTransactions: txThisMonth.length,
      averageExpense: txThisMonth.filter(t => t.type === "EXPENSE").length > 0
        ? Math.round(totalExpense / txThisMonth.filter(t => t.type === "EXPENSE").length)
        : 0
    },
    message: "Berhasil mengambil ringkasan keuangan"
  })
}