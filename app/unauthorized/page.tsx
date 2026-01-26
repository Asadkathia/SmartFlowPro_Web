export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
            <div className="text-center">
                <div className="bg-white rounded-lg shadow-lg p-12 max-w-md">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-darkGrey mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        Technicians cannot access the web admin dashboard.
                        <br />
                        Please use the SmartFlowPro mobile app.
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-darkGrey text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    )
}
