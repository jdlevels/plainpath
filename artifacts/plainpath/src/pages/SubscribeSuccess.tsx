export default function SubscribeSuccess() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-900/50 dark:bg-slate-950">
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Subscription started
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
          Welcome to PlainPath
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Your subscription was created successfully. You can now return to the app.
        </p>

        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Return to PlainPath
          </a>
        </div>
      </div>
    </div>
  )
}
