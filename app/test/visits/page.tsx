'use client';

import { useState, useEffect } from 'react';
import { VisitRepository } from '@/lib/repositories/visit-repository';
import { JobRepository } from '@/lib/repositories/job-repository';

export default function VisitTest() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedVisitId, setSelectedVisitId] = useState('');

    // Fetch jobs and visits on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // JobRepository.list() returns Job[] directly
                const jobsData = await JobRepository.list({});
                setJobs(jobsData || []);
                if (jobsData && jobsData.length > 0) {
                    setSelectedJobId(jobsData[0].id);
                }

                // VisitRepository.list() returns Visit[] directly
                const visitsData = await VisitRepository.list({});
                setVisits(visitsData || []);
                if (visitsData && visitsData.length > 0) {
                    setSelectedVisitId(visitsData[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    const refreshVisits = async () => {
        try {
            const visitsData = await VisitRepository.list({});
            setVisits(visitsData || []);
        } catch (error) {
            console.error('Failed to refresh visits:', error);
        }
    };

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

            // Refresh visits after create/update
            if (testName.includes('Create') || testName.includes('Update')) {
                await refreshVisits();
            }
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
        listVisits: () => runTest('List All Visits', () =>
            VisitRepository.list({})
        ),

        listByStatus: () => runTest('List Scheduled Visits', () =>
            VisitRepository.list({ status: 'scheduled' })
        ),

        createVisit: () => runTest('Create Visit', async () => {
            if (!selectedJobId) {
                return { error: 'No job selected. Please create a job first.' };
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            const endTime = new Date(tomorrow);
            endTime.setHours(11, 0, 0, 0);

            return VisitRepository.create({
                job_id: selectedJobId,
                scheduled_start: tomorrow.toISOString(),
                scheduled_end: endTime.toISOString(),
                status: 'scheduled'
            });
        }),

        updateVisit: () => runTest('Update Visit Status', async () => {
            if (!selectedVisitId) {
                return { error: 'No visit selected' };
            }

            return VisitRepository.update(selectedVisitId, {
                status: 'in_progress',
                actual_start: new Date().toISOString()
            });
        }),

        cancelVisit: () => runTest('Cancel Visit', async () => {
            if (!selectedVisitId) {
                return { error: 'No visit selected' };
            }

            return VisitRepository.cancel(selectedVisitId, 'Test cancellation');
        }),
    };

    return (
        <div className="min-h-screen bg-cream p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Visit Repository Test
                </h1>
                <p className="text-gray-600 mb-6">
                    Test visit scheduling, updates, and cancellations
                </p>

                {/* Job Selection */}
                {jobs.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-4">
                        <h2 className="text-lg font-semibold mb-4">Select Job for New Visit</h2>
                        <select
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {jobs.map((job) => (
                                <option key={job.id} value={job.id}>
                                    {job.job_number} - {job.service_type} ({job.status})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Visit Selection */}
                {visits.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Select Visit for Update/Cancel</h2>
                        <select
                            value={selectedVisitId}
                            onChange={(e) => setSelectedVisitId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {visits.map((visit) => (
                                <option key={visit.id} value={visit.id}>
                                    {visit.job?.job_number || 'Unknown Job'} - {visit.status} - {new Date(visit.scheduled_start).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Warning Messages */}
                {jobs.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-semibold mb-2">
                            ⚠️ No jobs found - Create Visit button is disabled
                        </p>
                        <p className="text-sm text-yellow-700">
                            Please create a job first via the <a href="/test/jobs" className="underline font-medium">Job Test page</a>.
                        </p>
                    </div>
                )}

                {visits.length === 0 && jobs.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800">
                            ℹ️ No visits yet. Update/Cancel buttons enabled after creating a visit.
                        </p>
                    </div>
                )}

                {/* Test Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={tests.listVisits}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            1. List All Visits
                        </button>
                        <button
                            onClick={tests.listByStatus}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            2. Filter Scheduled
                        </button>
                        <button
                            onClick={tests.createVisit}
                            disabled={loading || !selectedJobId}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            title={!selectedJobId ? 'No job available - create a job first' : ''}
                        >
                            3. Create Visit {!selectedJobId && '🔒'}
                        </button>
                        <button
                            onClick={tests.updateVisit}
                            disabled={loading || !selectedVisitId}
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                            title={!selectedVisitId ? 'No visit available - create a visit first' : ''}
                        >
                            4. Update Status {!selectedVisitId && '🔒'}
                        </button>
                        <button
                            onClick={tests.cancelVisit}
                            disabled={loading || !selectedVisitId}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            title={!selectedVisitId ? 'No visit available - create a visit first' : ''}
                        >
                            5. Cancel Visit {!selectedVisitId && '🔒'}
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
                        <li>✅ Jobs and visits auto-loaded in dropdowns</li>
                        <li>✅ Create uses selected job automatically</li>
                        <li>✅ Update/cancel use selected visit</li>
                        <li>✅ Dropdowns refresh after operations</li>
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
