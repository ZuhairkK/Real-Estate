export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <main className="max-w-xl text-center px-8">
        <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
          Activus AI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Professional credibility for real estate agents — built from real
          work, not social media.
        </p>
        <a
          href="/api/auth/login"
          className="inline-block bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-full font-medium hover:opacity-80 transition-opacity"
        >
          Connect Google Account
        </a>
      </main>
    </div>
  );
}
