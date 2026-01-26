'use client';

import { useState, useEffect } from 'react';
import { JobRepository } from '@/lib/repositories/job-repository';
import { CustomerRepository } from '@/lib/repositories/customer-repository';

export default function JobTest() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    // Fetch customers on mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data } = await CustomerRepository.list({ page: 1, pageSize: 20 });
                setCustomers(data || []);
                if (data && data.length > 0) {
                    setSelectedCustomerId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch customers:', error);
            }
        };
        fetchCustomers();
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
        listJobs: () => runTest('List Jobs', () =>
            JobRepository.list({})
        ),

        createJob: () => runTest('Create Job (Admin Only)', async () => {
            if (!selectedCustomerId) {
                return { error: 'No customer selected. Please create a customer first.' };
            }

            return JobRepository.create({
                customer_id: selectedCustomerId,
                service_type: 'Plumbing',
                priority: 'medium',
                notes: `Test job created at ${new Date().toLocaleTimeString()}`
            });
        }),

        getJob: () => runTest('Get Job by ID', async () => {
            const jobId = prompt('Enter job UUID:');
            if (!jobId) {
                return { error: 'Job ID required' };
            }
            return JobRepository.getById(jobId);
        }),
    };

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Job Repository Test
                </h1>
                <p className="text-gray-600 mb-6">
                    Test job creation with auto-numbering (Admin only)
                </p>

                {/* Customer Selection */}
                {customers.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Select Customer for Job Creation</h2>
                        <select
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.email || customer.phone || 'No contact'}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-600 mt-2">
                            Selected ID: {selectedCustomerId}
                        </p>
                    </div>
                )}

                {customers.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800">
                            ⚠️ No customers found. Please create a customer first via the Customer Test page.
                        </p>
                    </div>
                )}

                {/* Test Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={tests.listJobs}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            1. List Jobs
                        </button>
                        <button
                            onClick={tests.createJob}
                            disabled={loading || !selectedCustomerId}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            2. Create Job (Admin)
                        </button>
                        <button
                            onClick={tests.getJob}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            3. Get Job by ID
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
                        <li>✅ Customers auto-loaded in dropdown</li>
                        <li>✅ Create uses selected customer automatically</li>
                        <li>✅ Job number auto-generated (e.g., ORG-J-001)</li>
                        <li>✅ Only ADMIN can create jobs</li>
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
