'use client';

import { useState, useEffect } from 'react';
import { PaymentRepository } from '@/lib/repositories/payment-repository';
import { InvoiceRepository } from '@/lib/repositories/invoice-repository';

export default function PaymentTest() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    // Fetch unpaid/partially paid invoices
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await InvoiceRepository.list({});
                // Filter to show only invoices that aren't fully paid or voided
                // InvoiceRepository.list returns Invoice[] directly, not { data: ... }
                const payableInvoices = (Array.isArray(response) ? response : []).filter(
                    (inv: any) => inv.status !== 'paid' && inv.status !== 'void'
                );
                setInvoices(payableInvoices);
                if (payableInvoices.length > 0) {
                    setSelectedInvoiceId(payableInvoices[0].id);
                    setPaymentAmount(payableInvoices[0].total?.toString() || '100');
                }
            } catch (error) {
                console.error('Failed to fetch invoices:', error);
            }
        };
        fetchInvoices();
    }, []);

    const runTest = async (testName: string, testFn: () => Promise<any>) => {
        setLoading(true);
        try {
            const startTime = Date.now();
            const response = await testFn();
            const duration = Date.now() - startTime;

            setResult({
                test: testName,
                success: !response.error,
                duration: `${duration}ms`,
                ...response
            });
        } catch (error: any) {
            setResult({
                test: testName,
                success: false,
                error: error.message || 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    const tests = {
        listPayments: () => runTest('List Payments for Invoice', async () => {
            if (!selectedInvoiceId) {
                return { error: 'No invoice selected' };
            }
            return PaymentRepository.listByInvoice(selectedInvoiceId);
        }),

        recordPayment: () => runTest('Record Payment (Admin/Accountant)', async () => {
            if (!selectedInvoiceId) {
                return { error: 'No invoice selected' };
            }

            const amount = parseFloat(paymentAmount);
            if (isNaN(amount) || amount <= 0) {
                return { error: 'Invalid payment amount' };
            }

            return PaymentRepository.record({
                invoice_id: selectedInvoiceId,
                amount,
                method: 'cash',
                reference: `Test payment ${Date.now()}`,
                received_at: new Date().toISOString()
            });
        }),

        overpayTest: () => runTest('Test Overpayment Validation', async () => {
            if (!selectedInvoiceId) {
                return { error: 'No invoice selected' };
            }

            return PaymentRepository.record({
                invoice_id: selectedInvoiceId,
                amount: 999999.99,
                method: 'cash',
                reference: 'Overpayment test',
                received_at: new Date().toISOString()
            });
        }),
    };

    const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Payment Repository Test
                </h1>
                <p className="text-gray-600 mb-6">
                    Test payment recording and validation (Admin/Accountant only)
                </p>

                {/* Invoice Selection */}
                {invoices.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Select Invoice for Payment</h2>
                        <select
                            value={selectedInvoiceId}
                            onChange={(e) => {
                                setSelectedInvoiceId(e.target.value);
                                const inv = invoices.find(i => i.id === e.target.value);
                                if (inv) setPaymentAmount(inv.total?.toString() || '100');
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                        >
                            {invoices.map((invoice) => (
                                <option key={invoice.id} value={invoice.id}>
                                    Invoice #{invoice.invoice_number} - ${invoice.total || 0} ({invoice.status})
                                </option>
                            ))}
                        </select>

                        {selectedInvoice && (() => {
                            const paid = selectedInvoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                            return (
                                <div className="bg-gray-50 p-4 rounded mb-4">
                                    <p className="text-sm"><strong>Total:</strong> ${selectedInvoice.total || 0}</p>
                                    <p className="text-sm"><strong>Paid:</strong> ${paid}</p>
                                    <p className="text-sm"><strong>Due:</strong> ${(selectedInvoice.total || 0) - paid}</p>
                                    <p className="text-sm"><strong>Status:</strong> {selectedInvoice.status}</p>
                                </div>
                            );
                        })()}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Amount
                            </label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter amount"
                                step="0.01"
                            />
                        </div>
                    </div>
                )}

                {invoices.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800">
                            ⚠️ No unpaid invoices found. All invoices are either paid or voided.
                        </p>
                    </div>
                )}

                {/* Test Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={tests.listPayments}
                            disabled={loading || !selectedInvoiceId}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            1. List Payments
                        </button>
                        <button
                            onClick={tests.recordPayment}
                            disabled={loading || !selectedInvoiceId}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            2. Record Payment
                        </button>
                        <button
                            onClick={tests.overpayTest}
                            disabled={loading || !selectedInvoiceId}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            3. Test Overpayment
                        </button>
                    </div>
                </div>

                {/* Results Display */}
                {result && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Test Results</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${result.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {result.success ? '✅ PASS' : '❌ FAIL'}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="text-sm">
                                <span className="font-medium">Test:</span> {result.test}
                            </div>
                            {result.duration && (
                                <div className="text-sm">
                                    <span className="font-medium">Duration:</span> {result.duration}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded p-4 overflow-auto max-h-96">
                            <pre className="text-xs font-mono">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div className="animate-pulse text-blue-600 font-medium">
                            Running test...
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📝 Expected Results</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>✅ Unpaid invoices auto-loaded in dropdown</li>
                        <li>✅ Payment amount pre-filled with invoice total</li>
                        <li>✅ Overpayment test should fail validation</li>
                        <li>✅ Only ADMIN/ACCOUNTANT can record payments</li>
                    </ul>
                </div>

                <a
                    href="/test"
                    className="mt-6 inline-block text-primary hover:underline"
                >
                    ← Back to Test Suite
                </a>
            </div>
        </div>
    );
}
