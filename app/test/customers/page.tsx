'use client';

import { useState } from 'react';
import { CustomerRepository } from '@/lib/repositories/customer-repository';

export default function CustomerTest() {
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
        listCustomers: () => runTest('List Customers', () =>
            CustomerRepository.list({ page: 1, pageSize: 10 })
        ),

        createCustomer: () => runTest('Create Customer', () =>
            CustomerRepository.create({
                name: `Test Customer ${Date.now()}`,
                phone: '555-0100',
                email: `test${Date.now()}@example.com`,
                preferred_contact_method: 'call'
            })
        ),

        searchCustomers: () => runTest('Search Customers (phone)', () =>
            CustomerRepository.list({ search: '555' })
        ),

        pagination: () => runTest('Pagination (page 2)', () =>
            CustomerRepository.list({ page: 2, pageSize: 5 })
        ),
    };

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Customer Repository Test
                </h1>
                <p className="text-gray-600 mb-6">
                    Test all CustomerRepository functions
                </p>

                {/* Test Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={tests.listCustomers}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            1. List Customers
                        </button>
                        <button
                            onClick={tests.createCustomer}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            2. Create Customer
                        </button>
                        <button
                            onClick={tests.searchCustomers}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            3. Search Customers
                        </button>
                        <button
                            onClick={tests.pagination}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            4. Test Pagination
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
                            {result.data && (
                                <div className="text-sm">
                                    <span className="font-medium">Records:</span> {result.data.length} items
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
                        <li>✅ List should return only customers from your org</li>
                        <li>✅ Create should generate a new customer with UUID</li>
                        <li>✅ Search should filter results</li>
                        <li>✅ Pagination should skip first 5 records</li>
                        <li>❌ Should NOT see customers from other orgs</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
