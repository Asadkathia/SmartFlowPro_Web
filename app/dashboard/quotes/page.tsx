'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { QuoteRepository, type Quote, type QuoteStatus } from "@/lib/repositories/FinanceRepository"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const data = await QuoteRepository.list()
        setQuotes(data)
        setLoading(false)
    }

    const columns: QuoteStatus[] = ['draft', 'sent', 'accepted', 'invoiced']

    const getColumnQuotes = (status: QuoteStatus) => quotes.filter(q => q.status === status)

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Quotes Pipeline</h1>
                    <p className="text-slate-500">Track estimates from draft to invoice.</p>
                </div>
                <Link href="/dashboard/quotes/new">
                    <Button className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Quote
                    </Button>
                </Link>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                {columns.map(status => (
                    <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-3 bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold uppercase text-xs text-slate-500 tracking-wider">
                                {status} <span className="ml-1 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{getColumnQuotes(status).length}</span>
                            </h3>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-200">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                            </Button>
                        </div>

                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                            {getColumnQuotes(status).map(quote => (
                                <Card key={quote.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow border-slate-200 group">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="text-[10px] text-slate-400 font-mono">{quote.quote_number}</Badge>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[18px]">more_horiz</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">{quote.title}</h4>
                                    <p className="text-sm text-slate-500 mb-3">{quote.customer_name}</p>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto">
                                        <span className="font-bold text-slate-900">${quote.value.toLocaleString()}</span>
                                        <span className="text-xs text-slate-400">Exp: {new Date(quote.expiry_date).toLocaleDateString()}</span>
                                    </div>
                                </Card>
                            ))}
                            {getColumnQuotes(status).length === 0 && (
                                <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
