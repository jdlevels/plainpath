export function RequestDetail() {
  const timeline = [
    { event: "Request sent", desc: "Signature request sent to Alex Rivera", time: "Apr 22, 2026 · 2:14 PM", icon: "send", done: true },
    { event: "Email opened", desc: "Alex Rivera opened the email link", time: "Apr 22, 2026 · 5:42 PM", icon: "eye", done: true },
    { event: "Document viewed", desc: "Alex Rivera viewed the document (2 min 18 sec)", time: "Apr 23, 2026 · 10:05 AM", icon: "doc", done: true },
    { event: "Awaiting signature", desc: "Waiting for Alex Rivera to sign", time: "In progress", icon: "clock", done: false, active: true },
    { event: "Signature complete", desc: "All parties have signed", time: "", icon: "check", done: false },
    { event: "Audit certificate", desc: "Legal audit trail PDF generated", time: "", icon: "cert", done: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">Freelance Services Agreement</p>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Awaiting Signature
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Sent Apr 22, 2026 · Expires May 22, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Send Reminder
          </button>
          <button className="text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Download
          </button>
          <button className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Void
          </button>
        </div>
      </div>

      <div className="p-5 max-w-4xl mx-auto grid grid-cols-5 gap-5">
        {/* Left main */}
        <div className="col-span-3 space-y-4">
          {/* Document preview */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-7 bg-red-50 border border-red-100 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-red-400">PDF</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">Freelance_Services_Agreement.pdf</span>
                <span className="text-[10px] text-gray-400">2 pages</span>
              </div>
              <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
            <div className="bg-gray-50 p-4 flex items-center justify-center" style={{ height: 200 }}>
              <div className="bg-white shadow border border-gray-200 rounded" style={{ width: 240, height: 170 }}>
                <div className="p-4 text-[10px] text-gray-500 leading-relaxed">
                  <p className="font-bold text-center text-gray-700 text-[11px] mb-2">FREELANCE SERVICES AGREEMENT</p>
                  <p className="mb-1">This Agreement is entered into as of May 1, 2026 between PlainPath LLC and Alex Rivera...</p>
                  <p className="mb-1"><span className="font-semibold">1. SERVICES.</span> Contractor agrees to provide UX design services...</p>
                  <div className="mt-3 border-t border-dashed border-violet-300 pt-2 flex items-center gap-1">
                    <div className="w-16 h-4 bg-violet-50 border border-violet-300 rounded text-[8px] text-violet-500 flex items-center justify-center">Signature</div>
                    <div className="w-12 h-4 bg-emerald-50 border border-emerald-300 rounded text-[8px] text-emerald-500 flex items-center justify-center">Date</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit trail */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700">Audit Trail</p>
              <button className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download certificate
              </button>
            </div>
            <div className="px-4 py-3">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* Connector */}
                  {i < timeline.length - 1 && (
                    <div className={`absolute left-3.5 top-7 w-px h-full ${event.done ? "bg-violet-200" : "bg-gray-100"}`} style={{ height: 32 }} />
                  )}
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    event.done ? "bg-violet-100 text-violet-600" : event.active ? "bg-amber-100 text-amber-600 ring-2 ring-amber-200" : "bg-gray-100 text-gray-400"
                  }`}>
                    {event.icon === "send" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                    {event.icon === "eye" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                    {event.icon === "doc" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                    {event.icon === "clock" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {event.icon === "check" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {event.icon === "cert" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-4 flex-1">
                    <p className={`text-xs font-semibold ${event.done ? "text-gray-800" : event.active ? "text-amber-700" : "text-gray-400"}`}>{event.event}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{event.desc}</p>
                    {event.time && <p className={`text-[10px] mt-0.5 font-medium ${event.active ? "text-amber-500" : event.done ? "text-violet-500" : "text-gray-300"}`}>{event.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-2 space-y-4">
          {/* Signers */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Signers</p>
            <div className="space-y-2">
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">AR</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Alex Rivera</p>
                    <p className="text-[10px] text-gray-400">alex@designco.com</p>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">Pending</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                  <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">Client</span>
                  <span>·</span>
                  <span>Viewed 2 times</span>
                </div>
                <button className="mt-2 w-full text-[11px] text-violet-600 border border-violet-200 hover:bg-violet-50 py-1 rounded-lg font-medium transition-colors">
                  Send Reminder
                </button>
              </div>
            </div>
          </div>

          {/* Request details */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-700">Request Details</p>
            {[
              { label: "Created by", value: "You" },
              { label: "Sent", value: "Apr 22, 2026 · 2:14 PM" },
              { label: "Expires", value: "May 22, 2026" },
              { label: "Document ID", value: "sig_Hx92mKp..." },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Message */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-2">Message Sent</p>
            <p className="text-xs text-gray-500 leading-relaxed italic">
              "Please review and sign the attached freelance services agreement at your earliest convenience."
            </p>
          </div>

          {/* Security */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-[11px] font-semibold text-violet-700">Legally binding</p>
              <p className="text-[10px] text-violet-600 mt-0.5">Secured by Dropbox Sign · Full audit certificate available after signing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
