'use client';

import Link from 'next/link';

export default function TestHome() {
    const tests = [
        {
            name: 'Customer Repository',
            path: '/test/customers',
            description: 'Test customer CRUD operations',
            status: 'ready'
        },
        {
            name: 'Job Repository',
            path: '/test/jobs',
            description: 'Test job creation and auto-numbering',
            status: 'ready'
        },
        {
            name: 'Visit Repository',
            path: '/test/visits',
            description: 'Test visit scheduling and updates',
            status: 'ready'
        },
        {
            name: 'Payment Repository',
            path: '/test/payments',
            description: 'Test payment recording and validation',
            status: 'ready'
        },
        {
            name: 'Invoice Repository',
            path: '/test/invoices',
            description: 'Test invoice listing and voiding',
            status: 'ready'
        },
        {
            name: 'Team Repository',
            path: '/test/team',
            description: 'Test team member invitations',
            status: 'ready'
        },
        {
            name: 'Inventory Repository',
            path: '/test/inventory',
            description: 'Test inventory item management',
            status: 'ready'
        },
    ];

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Backend Test Suite
                </h1>
                <p className="text-gray-600 mb-8">
                    Test all repository functions before building the UI
                </p>

                <div className="grid gap-4">
                    {tests.map((test) => (
                        <Link
                            key={test.path}
                            href={test.status === 'ready' ? test.path : '#'}
                            className={`block bg-white rounded-lg shadow p-6 transition-all ${test.status === 'ready'
                                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                        {test.name}
                                    </h2>
                                    <p className="text-gray-600 text-sm">{test.description}</p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${test.status === 'ready'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {test.status === 'ready' ? 'Ready to test' : 'Coming soon'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">📋 Testing Checklist</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>Phase 1: Repository Function Testing (7 repositories)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>Phase 2: Role-Based Access Control (3 user roles)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>Phase 3: Integration Flows (3 workflows)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>Phase 4: Cross-Org Access Testing</span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="mt-6 inline-block text-primary hover:underline"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
