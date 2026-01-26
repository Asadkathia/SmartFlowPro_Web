'use client';

import { useState } from 'react';
import { InvoiceRepository } from '@/lib/repositories/invoice-repository';



export default function InvoiceTest() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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
        listAll: () => runTest('List All Invoices', () =>
            InvoiceRepository.list({ limit: 10 })
        ),

        listByStatus: () => runTest('List Paid Invoices', () =>
            InvoiceRepository.list({ status: 'paid', limit: 10 })
        ),

        getById: () => runTest('Get Invoice by ID', async () => {
            const invoiceId = prompt('Enter invoice UUID:');
            if (!invoiceId) {
                return { error: 'Invoice ID required' };
            }
            return InvoiceRepository.getById(invoiceId);
        }),

        voidInvoice: () => runTest('Void Invoice (Admin Only)', async () => {
            const invoiceId = prompt('Enter invoice UUID to void:');
            if (!invoiceId) {
                return { error: 'Invoice ID required' };
            }
            return InvoiceRepository.void(invoiceId);
        }),
    };

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Invoice Repository Test
                </h1>
                <p className="text-gray-600 mb-6">
                    Test invoice listing and voiding (Admin only for void)
                </p>

                {/* Test Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={tests.listAll}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            1. List All Invoices
                        </button>
                        <button
                            onClick={tests.listByStatus}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            2. Filter by Status
                        </button>
                        <button
                            onClick={tests.getById}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            3. Get by ID
                        </button>
                        <button
                            onClick={tests.voidInvoice}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            4. Void Invoice (Admin)
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
                        <li>✅ List shows invoices with status (draft, sent, paid, void)</li>
                        <li>✅ Status filter works correctly</li>
                        <li>✅ Get by ID returns invoice with line items</li>
                        <li>✅ Only ADMIN can void invoices</li>
                        <li>❌ Voided invoices cannot be paid</li>
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
