export function Dashboard() {
  const stats = [
    { label: "Awaiting Others", value: 3, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Completed", value: 12, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Needs Your Action", value: 1, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    { label: "Declined / Voided", value: 2, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  ]

  const requests = [
    {
      id: 1,
      title: "Freelance Services Agreement",
      signer: "Alex Rivera",
      signerEmail: "alex@designco.com",
      role: "Client",
      status: "awaiting",
      statusLabel: "Awaiting Signature",
      sent: "Apr 22, 2026",
      expires: "May 22, 2026",
      viewed: true,
      avatar: "AR",
      avatarBg: "bg-blue-500",
    },
    {
      id: 2,
      title: "NDA — Colonial Forge High School",
      signer: "Jeffrey Holt",
      signerEmail: "jeffrey@cfhs.edu",
      role: "Counterparty",
      status: "awaiting",
      statusLabel: "Awaiting Signature",
      sent: "Apr 20, 2026",
      expires: "May 20, 2026",
      viewed: false,
      avatar: "JH",
      avatarBg: "bg-indigo-500",
    },
    {
      id: 3,
      title: "Photography License Agreement",
      signer: "Maria Chen",
      signerEmail: "maria@chen.studio",
      role: "Licensor",
      status: "completed",
      statusLabel: "Signed",
      sent: "Apr 15, 2026",
      signed: "Apr 16, 2026",
      avatar: "MC",
      avatarBg: "bg-emerald-500",
    },
    {
      id: 4,
      title: "Vendor Contract Renewal",
      signer: "David Park",
      signerEmail: "d.park@supplierco.com",
      role: "Vendor",
      status: "completed",
      statusLabel: "Signed",
      sent: "Apr 10, 2026",
      signed: "Apr 12, 2026",
      avatar: "DP",
      avatarBg: "bg-teal-500",
    },
    {
      id: 5,
      title: "Office Lease Amendment",
      signer: "Sandra Wu",
      signerEmail: "swu@realty.com",
      role: "Landlord",
      status: "declined",
      statusLabel: "Declined",
      sent: "Apr 8, 2026",
      avatar: "SW",
      avatarBg: "bg-rose-500",
    },
  ]

  const statusColors: Record<string, string> = {
    awaiting: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    declined: "bg-red-100 text-red-600 border-red-200",
  }

  const statusDots: Record<string, string> = {
    awaiting: "bg-amber-500",
    completed: "bg-emerald-500",
    declined: "bg-red-500",
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">Digital Signature</span>
        </div>
        <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      </div>

      <div className="px-6 py-5 max-w-5xl">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`border rounded-xl p-3.5 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 mb-4 border-b border-gray-200">
          {["All Documents", "Awaiting Others", "Completed", "Declined"].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                i === 0
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-2">
            <input
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-48 bg-white text-gray-600 placeholder:text-gray-400 outline-none"
              placeholder="Search documents…"
            />
          </div>
        </div>

        {/* Request list */}
        <div className="space-y-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer group"
            >
              {/* File icon */}
              <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-5 h-5 rounded-full ${r.avatarBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[9px] font-bold">{r.avatar}</span>
                  </div>
                  <span className="text-xs text-gray-500">{r.signer}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{r.role}</span>
                  {r.status === "awaiting" && !r.viewed && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Not opened</span>
                  )}
                  {r.status === "awaiting" && r.viewed && (
                    <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">Viewed</span>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-gray-400">Sent {r.sent}</p>
                {r.signed && <p className="text-xs text-emerald-600 mt-0.5">Signed {r.signed}</p>}
                {r.expires && r.status === "awaiting" && <p className="text-xs text-gray-400 mt-0.5">Expires {r.expires}</p>}
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-xs font-medium border px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDots[r.status]}`} />
                  {r.statusLabel}
                </span>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {r.status === "awaiting" && (
                  <button className="text-xs text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors font-medium">
                    Remind
                  </button>
                )}
                {r.status === "completed" && (
                  <button className="text-xs text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors font-medium">
                    Download
                  </button>
                )}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Legally binding e-signatures · Powered by Dropbox Sign
        </p>
      </div>
    </div>
  )
}
