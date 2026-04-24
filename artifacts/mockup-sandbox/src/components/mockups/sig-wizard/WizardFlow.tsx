export function WizardFlow() {
  const steps = [
    { num: 1, label: "Document", done: true },
    { num: 2, label: "Recipients", active: true },
    { num: 3, label: "Prepare", done: false },
    { num: 4, label: "Review & Send", done: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">New Signature Request</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 ml-6">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className="flex items-center gap-1.5 px-3 py-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  step.done
                    ? "bg-violet-600 text-white"
                    : step.active
                    ? "bg-violet-600 text-white ring-2 ring-violet-200"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {step.done && !step.active ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.num}
                </div>
                <span className={`text-xs font-medium ${step.active ? "text-violet-700" : step.done ? "text-gray-600" : "text-gray-400"}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${step.done ? "bg-violet-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left: Document confirmed */}
        <div className="w-72 border-r border-gray-200 bg-white p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Document</p>
            <div className="border border-gray-200 rounded-xl p-3 flex items-start gap-3">
              <div className="w-10 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-red-400 tracking-tight">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">Freelance_Services_Agreement.pdf</p>
                <p className="text-xs text-gray-400 mt-0.5">2 pages · 48 KB</p>
                <button className="text-[11px] text-violet-600 hover:underline mt-1">Change</button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Signing Order</p>
            <div className="flex items-center gap-2">
              <button className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:border-violet-300 transition-colors bg-violet-50 border-violet-200 text-violet-700 font-medium">Sequential</button>
              <button className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:border-gray-300 transition-colors">All at once</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expiration</p>
            <div className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-600 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              30 days from send
            </div>
          </div>
        </div>

        {/* Main: Recipients */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Who needs to sign?</h2>
            <p className="text-sm text-gray-500 mb-5">Add recipients in signing order. Each person receives a secure email with a link to sign.</p>

            {/* Recipient 1 — filled */}
            <div className="border border-violet-200 bg-violet-50/30 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">1</div>
                <span className="text-xs font-semibold text-violet-700">Signer 1</span>
                <span className="ml-auto text-[10px] bg-violet-100 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded font-medium">Signs First</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Full name</label>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">Alex Rivera</div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Email</label>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">alex@designco.com</div>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Role / Title (optional)</label>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 italic">e.g. Client, Contractor, Tenant</div>
                </div>
              </div>
            </div>

            {/* Recipient 2 — empty */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-3 hover:border-violet-300 transition-colors group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center">2</div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-violet-600">Signer 2 (optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1 block">Full name</label>
                  <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400">Add a name…</div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1 block">Email</label>
                  <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400">Add an email…</div>
                </div>
              </div>
            </div>

            {/* Add recipient */}
            <button className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium mb-6 mt-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another recipient
            </button>

            {/* Message */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Message to signers (optional)</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 placeholder:text-gray-400 resize-none bg-white outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                rows={3}
                placeholder="Add a note to be included in the email to signers…"
                defaultValue="Please review and sign the attached freelance services agreement at your earliest convenience."
              />
            </div>

            {/* Next button */}
            <div className="flex items-center gap-3">
              <button className="flex-1 border border-gray-200 bg-white text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                Continue to Prepare
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Signatures are legally binding and secured by Dropbox Sign
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
