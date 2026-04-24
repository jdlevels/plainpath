export function PrepareWorkspace() {
  const fieldTypes = [
    { type: "signature", label: "Signature", color: "bg-violet-500", border: "border-violet-300", light: "bg-violet-50", text: "text-violet-700", icon: "✍" },
    { type: "initials", label: "Initials", color: "bg-blue-500", border: "border-blue-300", light: "bg-blue-50", text: "text-blue-700", icon: "AB" },
    { type: "date", label: "Date Signed", color: "bg-emerald-500", border: "border-emerald-300", light: "bg-emerald-50", text: "text-emerald-700", icon: "📅" },
    { type: "name", label: "Full Name", color: "bg-amber-500", border: "border-amber-300", light: "bg-amber-50", text: "text-amber-700", icon: "👤" },
    { type: "text", label: "Text Field", color: "bg-gray-400", border: "border-gray-300", light: "bg-gray-50", text: "text-gray-600", icon: "T" },
  ]

  const placedFields = [
    { id: 1, type: "signature", label: "Signature", x: 180, y: 360, w: 200, h: 44, color: "border-violet-400 bg-violet-50", textColor: "text-violet-500", selected: true },
    { id: 2, type: "date", label: "Date Signed", x: 420, y: 360, w: 140, h: 32, color: "border-emerald-400 bg-emerald-50", textColor: "text-emerald-600", selected: false },
    { id: 3, type: "name", label: "Full Name", x: 180, y: 200, w: 200, h: 32, color: "border-amber-400 bg-amber-50", textColor: "text-amber-600", selected: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-900">Freelance_Services_Agreement.pdf</p>
          <p className="text-[11px] text-gray-400">Prepare document · Step 3 of 4</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">2 pages</span>
          <span className="text-[11px] text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded-lg font-medium">3 fields placed</span>
          <button className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            Review & Send
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: field palette */}
        <div className="w-52 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Signer</p>
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg p-2">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold">AR</div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Alex Rivera</p>
                <p className="text-[10px] text-gray-400">alex@designco.com</p>
              </div>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Field Types</p>
            <p className="text-[10px] text-gray-400 mb-3">Click a field type, then click on the document to place it.</p>
            <div className="space-y-1.5">
              {fieldTypes.map((f) => (
                <button
                  key={f.type}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all text-left hover:shadow-sm ${
                    f.type === "signature"
                      ? `${f.border} ${f.light} shadow-sm ring-2 ring-violet-200`
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md ${f.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                    {f.icon}
                  </div>
                  <span className={`text-xs font-medium ${f.type === "signature" ? f.text : "text-gray-600"}`}>{f.label}</span>
                  {f.type === "signature" && (
                    <span className="ml-auto text-[9px] text-violet-500 font-semibold">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Placed Fields</p>
              <div className="space-y-1">
                {placedFields.map((f) => (
                  <div key={f.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${f.selected ? "bg-violet-50 border border-violet-200" : "hover:bg-gray-50"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${f.type === "signature" ? "bg-violet-500" : f.type === "date" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="text-[11px] text-gray-600">{f.label}</span>
                    <button className="ml-auto text-gray-300 hover:text-red-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: PDF canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 flex flex-col items-center py-6 px-4 gap-4">
          {/* Page 1 */}
          <div className="relative bg-white shadow-lg" style={{ width: 612, height: 480 }}>
            {/* Page label */}
            <div className="absolute -top-5 left-0 text-[10px] text-gray-400 font-medium">Page 1 of 2</div>

            {/* Mock document content */}
            <div className="p-8 text-xs text-gray-700 leading-relaxed">
              <p className="font-bold text-sm text-center mb-4 text-gray-900">FREELANCE SERVICES AGREEMENT</p>
              <p className="mb-2">This Freelance Services Agreement ("Agreement") is entered into as of May 1, 2026 between PlainPath LLC ("Client") and Alex Rivera ("Contractor").</p>
              <p className="font-semibold mt-3 mb-1">1. SERVICES</p>
              <p className="mb-2">Contractor agrees to provide UX design services as described in the attached Statement of Work. Services shall be delivered no later than June 30, 2026.</p>
              <p className="font-semibold mt-3 mb-1">2. COMPENSATION</p>
              <p className="mb-2">Client shall pay Contractor $7,500 upon completion of each milestone, as defined in the attached Schedule A.</p>
              <p className="font-semibold mt-3 mb-1">3. CONFIDENTIALITY</p>
              <p className="mb-2">Contractor agrees to maintain strict confidentiality of all Client materials, data, and proprietary information disclosed during the term of this Agreement.</p>

              {/* Placed field: Name */}
              <div
                className="absolute border-2 border-dashed border-amber-400 bg-amber-50 rounded flex items-center px-2"
                style={{ left: 180, top: 200, width: 200, height: 32 }}
              >
                <span className="text-[10px] text-amber-600 font-medium">Full Name</span>
                <div className="ml-auto w-3 h-3 rounded bg-amber-400 flex items-center justify-center cursor-se-resize">
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8"><path d="M2 6l4-4M4 6l2-2" stroke="white" strokeWidth={1}/></svg>
                </div>
              </div>

              {/* Placed field: Signature (selected with handles) */}
              <div
                className="absolute border-2 border-violet-500 bg-violet-50 rounded-md flex items-center px-2 shadow-md"
                style={{ left: 180, top: 360, width: 200, height: 44 }}
              >
                <svg className="w-4 h-4 text-violet-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                </svg>
                <span className="text-[10px] text-violet-600 font-semibold">Signature</span>
                {/* Resize handle */}
                <div className="ml-auto w-3 h-3 rounded bg-violet-500 flex items-center justify-center cursor-se-resize">
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8"><path d="M2 6l4-4M4 6l2-2" stroke="white" strokeWidth={1}/></svg>
                </div>
                {/* Delete button */}
                <button className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:border-red-300">
                  <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Placed field: Date */}
              <div
                className="absolute border-2 border-dashed border-emerald-400 bg-emerald-50 rounded flex items-center px-2"
                style={{ left: 420, top: 368, width: 140, height: 32 }}
              >
                <span className="text-[10px] text-emerald-600 font-medium">Date Signed</span>
              </div>
            </div>
          </div>

          {/* Page 2 preview */}
          <div className="relative bg-white shadow-md opacity-60" style={{ width: 612, height: 200 }}>
            <div className="absolute -top-5 left-0 text-[10px] text-gray-400 font-medium">Page 2 of 2</div>
            <div className="p-8 text-xs text-gray-400">
              <p className="font-semibold text-gray-500 mb-2">4. INDEPENDENT CONTRACTOR</p>
              <p>Contractor is an independent contractor and not an employee of Client. Contractor is responsible for all applicable taxes and compliance with applicable laws...</p>
            </div>
          </div>
        </div>

        {/* Right sidebar: field properties */}
        <div className="w-48 border-l border-gray-200 bg-white p-3 flex-shrink-0">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Field Properties</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Type</label>
              <div className="border border-violet-200 bg-violet-50 rounded-lg px-2 py-1.5 text-xs text-violet-700 font-medium">Signature</div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Required</label>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-violet-600 rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
                <span className="text-[11px] text-gray-600">Yes</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Assigned to</label>
              <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white text-[8px] font-bold">AR</div>
                <span className="text-[11px] text-gray-700">Alex Rivera</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Placeholder hint</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-600" defaultValue="Sign here" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tip</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Click any field to select it. Drag to move, drag the corner handle to resize.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
