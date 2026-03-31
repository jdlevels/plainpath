export default function SubscribeCancel() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Checkout canceled
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
          No charge was made
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          You can return to PlainPath and choose a plan whenever you're ready.
        </p>

        <div className="mt-8">
          <a
            href="/#pricing"
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Back to Pricing
          </a>
        </div>
      </div>
    </div>
  )
}
