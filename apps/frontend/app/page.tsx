import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Village Events</h1>
          <p className="text-gray-500">Register your group for upcoming events across our villages</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/register"
            className="btn-primary w-full text-base py-3"
          >
            Register for an Event
          </Link>
          <Link
            href="/admin"
            className="btn-secondary w-full text-sm"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </main>
  );
}
