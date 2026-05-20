import React, { useState } from 'react';
import './_group.css';
import {
  FileText, CheckCircle2, Circle,
  AlertCircle, FileWarning,
  Download, Save, File, LayoutTemplate,
  BookOpen, ListChecks, ArrowRight, Loader2,
  Hash, ExternalLink, ShieldCheck
} from 'lucide-react';

export function AnalyzeWorkspace() {
  const [activeTab, setActiveTab] = useState('Plain English Summary');

  const tabs = [
    { id: 'Plain English Summary', icon: BookOpen },
    { id: 'Source Sections',       icon: Hash },
    { id: 'Missing Items',         icon: AlertCircle },
    { id: 'Action Plan',           icon: ListChecks },
    { id: 'Export',                icon: Download },
  ];

  const workflowSteps = [
    { label: 'Upload',        status: 'completed' },
    { label: 'Scan',          status: 'completed' },
    { label: 'Understand',    status: 'active',    note: 'Extracting clauses…' },
    { label: 'Missing Items', status: 'pending' },
    { label: 'Action Plan',   status: 'pending' },
    { label: 'Save',          status: 'pending' },
  ];

  const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
    'Before signing':  { bg: '#EBF1FF', text: '#2C4A7C' },
    'At move-in':      { bg: '#E8F5EE', text: '#2D7D4F' },
    'During tenancy':  { bg: '#F3F0FF', text: '#6D4CB5' },
  };

  return (
    <div className="plainpath-v15-theme flex flex-col h-screen overflow-hidden" style={{ fontSize: 14 }}>

      {/* ── Top Bar ──────────────────────────── */}
      <header className="h-14 bg-white border-b border-[#E5E2DC] flex items-center justify-between px-6 shrink-0 z-10" style={{ boxShadow: '0 1px 0 #E5E2DC' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-[15px]" style={{ color: '#2C4A7C' }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#2C4A7C', boxShadow: '0 2px 6px rgba(44,74,124,0.35)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            PlainPath
          </div>
          <div className="h-4 w-px bg-[#E5E2DC]" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#888888]" />
            <span className="font-semibold text-[13px] text-[#1A1A1A]">Residential Lease Agreement.pdf</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border" style={{ background: '#FFF8F0', color: '#B45309', borderColor: '#FDE0B2' }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing…
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#555555] text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#F8F7F4] transition-colors border border-transparent hover:border-[#E5E2DC]">Help</button>
          <div className="w-8 h-8 rounded-full bg-[#2C4A7C] text-white flex items-center justify-center text-[11px] font-bold cursor-pointer" style={{ boxShadow: '0 0 0 2px #EBF1FF, 0 0 0 3px #C7D8F5' }}>JD</div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden bg-[#F8F7F4]">

        {/* Left Panel */}
        <section className="w-[40%] border-r border-[#E5E2DC] bg-white flex flex-col overflow-hidden relative" style={{ boxShadow: '1px 0 0 0 #E5E2DC' }}>
          <div className="flex-1 overflow-y-auto p-6 pb-28 pp-scrollbar">
            <h2 className="text-[13px] font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
              Document Status
              <div className="flex-1 h-px bg-[#E5E2DC] ml-1" />
            </h2>

            {/* Document card */}
            <div className="rounded-xl border border-[#E5E2DC] p-4 mb-6 flex items-start gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)', background: '#fff' }}>
              <div className="w-10 h-12 bg-[#F8F7F4] rounded-lg border border-[#E5E2DC] flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-[#4F7CAC]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1A1A1A] text-[12px] mb-1.5 truncate">Residential Lease Agreement.pdf</h3>
                <div className="flex items-center gap-2 text-[11px] text-[#888888]">
                  <span>14 pages</span>
                  <span className="w-1 h-1 rounded-full bg-[#D4D0C8]" />
                  <span>2.4 MB</span>
                  <span className="w-1 h-1 rounded-full bg-[#D4D0C8]" />
                  <span>2 mins ago</span>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 border" style={{ background: '#E8F5EE', color: '#2D7D4F', borderColor: '#B6E5CB' }}>
                <CheckCircle2 className="w-3 h-3" />
                Processed
              </div>
            </div>

            {/* Workflow */}
            <div>
              <h3 className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.1em] mb-5">Analysis Workflow</h3>
              <div className="relative pl-4 border-l-2 border-[#E5E2DC] ml-3 space-y-5">
                {workflowSteps.map((step) => (
                  <div key={step.label} className="relative flex items-center gap-4">
                    <div className={`absolute -left-[25px] w-5 h-5 rounded-full flex items-center justify-center bg-white ring-2 ${
                      step.status === 'completed' ? 'ring-[#B6E5CB]' :
                      step.status === 'active'    ? 'ring-[#C7D8F5]' : 'ring-[#E5E2DC]'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2D7D4F]" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="w-4 h-4 text-[#2C4A7C] animate-spin" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#D4D0C8]" />
                      )}
                    </div>
                    <div className={`text-[13px] font-semibold ${
                      step.status === 'completed' ? 'text-[#1A1A1A]' :
                      step.status === 'active'    ? 'text-[#2C4A7C]' : 'text-[#AAAAAA]'
                    }`}>
                      {step.label}
                    </div>
                    {step.note && (
                      <div className="text-[11px] font-medium text-[#B45309] bg-[#FFF8F0] border border-[#FDE0B2] px-2.5 py-1 rounded-full ml-auto">
                        {step.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </section>

        {/* Right Panel */}
        <section className="w-[60%] flex flex-col relative bg-[#F8F7F4]">

          {/* Tabs */}
          <div className="bg-white border-b border-[#E5E2DC] px-2 flex items-end gap-0.5 overflow-x-auto shrink-0 pt-1" style={{ boxShadow: '0 1px 0 #E5E2DC' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#2C4A7C] text-[#2C4A7C] bg-[#FAFBFF]'
                    : 'border-transparent text-[#888888] hover:text-[#1A1A1A] hover:bg-[#F8F7F4] rounded-t'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-[#2C4A7C]' : 'text-[#AAAAAA]'}`} />
                {tab.id}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pp-scrollbar p-7 pb-28">

            {activeTab === 'Plain English Summary' && (
              <div className="max-w-2xl space-y-7">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#2C4A7C] animate-pp-pulse" />
                  <span className="text-[12px] font-bold text-[#2C4A7C]">Analysis in progress</span>
                </div>

                {/* Summary card */}
                <div className="rounded-xl border border-[#C7D8F5] border-l-[3px] border-l-[#2C4A7C] bg-white p-5" style={{ boxShadow: '0 2px 12px rgba(44,74,124,0.08), 0 1px 3px rgba(44,74,124,0.05)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#4F7CAC] mb-3">Plain English Summary</p>
                  <p className="text-[#1A1A1A] leading-relaxed text-[13.5px]">
                    This is a standard 12-month residential lease for the property at 123 Main St. Rent is <strong>$2,400/month</strong> due on the 1st, with a <strong>$2,400 security deposit</strong> due upfront. The landlord handles major maintenance and structural repairs. You're responsible for daily upkeep, utilities, and keeping the unit in good condition.
                  </p>
                </div>

                {/* Key Points */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                    Key Points <span className="text-[11px] font-semibold text-[#888888] ml-1">4 items</span>
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { text: 'Rent grace period of 5 days before late fees apply ($50 + $10/day thereafter).', page: 'Page 2' },
                      { text: 'Tenant is responsible for all utilities except water and trash collection.', page: 'Page 4' },
                      { text: 'No pets without prior written consent and a $500 refundable pet deposit.', page: 'Page 6' },
                      { text: '60-day written notice required from either party for lease termination or non-renewal.', page: 'Page 11' },
                    ].map((pt, i) => (
                      <div key={i} className="bg-white border border-[#E5E2DC] rounded-xl p-3.5 flex items-start gap-3 hover:border-[#4F7CAC] hover:shadow-[0_2px_8px_rgba(44,74,124,0.07)] transition-all cursor-pointer group">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white" style={{ background: '#4F7CAC', minWidth: 20 }}>{i + 1}</div>
                        <p className="text-[13px] text-[#1A1A1A] leading-relaxed flex-1">{pt.text}</p>
                        <div className="bg-[#F0EDE8] group-hover:bg-[#EBF1FF] group-hover:text-[#2C4A7C] rounded px-1.5 py-0.5 text-[10px] font-bold text-[#888888] whitespace-nowrap shrink-0 flex items-center gap-1 transition-colors">
                          <ExternalLink size={9} /> {pt.page}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Items preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-2">
                      What's Missing <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFF3E0', color: '#B45309' }}>2</span>
                    </h3>
                    <button onClick={() => setActiveTab('Missing Items')} className="text-[#2C4A7C] text-[12px] font-bold hover:underline flex items-center gap-1">
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Certificate of Insurance not attached', detail: 'Section 14 references Exhibit B (Proof of Renter\'s Insurance), but no attachment is included.' },
                      { title: 'Move-in inspection checklist not referenced', detail: 'Standard leases include a condition report at move-in to protect your security deposit.' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl p-4 flex items-start gap-3 border" style={{ background: '#FFF8F0', borderColor: '#FDE0B2' }}>
                        <FileWarning className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-[#92400E] text-[12.5px] mb-1">{item.title}</h4>
                          <p className="text-[12px] text-[#B45309] leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Source Sections' && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-0.5">Source Sections</h3>
                  <p className="text-[13px] text-[#555555]">The sections PlainPath identified and used to build your analysis.</p>
                </div>
                {[
                  { section: 'Section 2 — Rent & Payment Terms', pages: 'Pages 2–3', excerpt: 'Monthly rent of $2,400 is due on the 1st of each month. A 5-day grace period applies before a $50 late fee is assessed, plus $10/day thereafter.' },
                  { section: 'Section 6 — Utilities & Services',  pages: 'Page 4',   excerpt: 'Tenant shall pay for electricity, gas, phone, cable, and internet service. Landlord shall maintain water, sewer, and trash collection.' },
                  { section: 'Section 9 — Pets Policy',           pages: 'Page 6',   excerpt: 'No animals or pets of any kind shall be kept on the premises without prior written consent of Landlord and a $500 refundable pet deposit.' },
                  { section: 'Section 14 — Attachments & Exhibits', pages: 'Pages 10–11', excerpt: 'This Agreement incorporates by reference Exhibit A (Property Description) and Exhibit B (Certificate of Insurance). Exhibit B was not found in the uploaded document.' },
                  { section: 'Section 16 — Termination & Renewal', pages: 'Pages 11–12', excerpt: 'Either party may terminate this Agreement by providing no less than sixty (60) days written notice prior to the end of the lease term.' },
                ].map((s, i) => (
                  <div key={i} className="bg-white border border-[#E5E2DC] rounded-xl p-5 hover:border-[#4F7CAC] hover:shadow-[0_2px_10px_rgba(44,74,124,0.08)] transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="font-bold text-[13px] text-[#1A1A1A] group-hover:text-[#2C4A7C] transition-colors">{s.section}</h4>
                      <span className="bg-[#EBF1FF] text-[#2C4A7C] text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Hash size={9} /> {s.pages}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#555555] leading-relaxed italic border-l-2 border-[#D4D0C8] pl-3 group-hover:border-[#4F7CAC] transition-colors">"{s.excerpt}"</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Missing Items' && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-0.5">What's Missing</h3>
                  <p className="text-[13px] text-[#555555]">Items that a standard agreement of this type would typically include.</p>
                </div>
                {[
                  { title: 'Certificate of Insurance not attached',       detail: 'Section 14 references Exhibit B (Proof of Renter\'s Insurance), but the document is not included. Most landlords require this before move-in.', ref: 'Section 14, Page 10' },
                  { title: 'Move-in inspection checklist not referenced', detail: 'Standard residential leases include or reference a property condition report signed by both parties at move-in. Without it, deposit disputes are harder to resolve.', ref: 'Not present' },
                  { title: 'Landlord emergency maintenance contact',       detail: 'No after-hours or emergency contact information is provided. This is common in residential leases and protects tenants in urgent situations.', ref: 'Not present' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-5 border" style={{ background: '#FFF8F0', borderColor: '#FDE0B2', boxShadow: '0 1px 4px rgba(180,83,9,0.07)' }}>
                    <div className="flex items-start gap-3 mb-2.5">
                      <FileWarning className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                      <h4 className="font-bold text-[#92400E] text-[13.5px]">{item.title}</h4>
                    </div>
                    <p className="text-[12px] text-[#B45309] leading-relaxed ml-7 mb-3">{item.detail}</p>
                    <span className="ml-7 inline-flex items-center gap-1 text-[10px] font-bold text-[#888888] bg-white border border-[#E5E2DC] px-2 py-0.5 rounded-full">
                      <Hash size={9} /> {item.ref}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Action Plan' && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-0.5">Action Plan</h3>
                  <p className="text-[13px] text-[#555555]">Steps to take before and after signing this lease.</p>
                </div>
                {[
                  { priority: 'Before signing', action: 'Request that Exhibit B (Certificate of Insurance) be attached, or obtain renter\'s insurance and provide a copy.' },
                  { priority: 'Before signing', action: 'Ask the landlord to conduct a written move-in inspection and attach the checklist as an exhibit.' },
                  { priority: 'Before signing', action: 'Confirm an emergency maintenance contact number and ask that it be added to the lease.' },
                  { priority: 'At move-in',     action: 'Photograph all pre-existing damage in each room and email photos to landlord to create a timestamped record.' },
                  { priority: 'During tenancy', action: 'Set a calendar reminder 65 days before the lease end date to submit your 60-day written notice of intent.' },
                ].map((item, i) => {
                  const c = PRIORITY_COLOR[item.priority] || { bg: '#F0EDE8', text: '#555555' };
                  return (
                    <div key={i} className="bg-white border border-[#E5E2DC] rounded-xl p-4 flex items-start gap-4 hover:border-[#4F7CAC] hover:shadow-[0_2px_10px_rgba(44,74,124,0.07)] transition-all cursor-pointer">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold border-2" style={{ borderColor: c.bg, color: c.text, background: c.bg }}>{i + 1}</div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block px-2 py-0.5 rounded-full w-max" style={{ background: c.bg, color: c.text }}>{item.priority}</span>
                        <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{item.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'Export' && (
              <div className="max-w-lg space-y-4">
                <div>
                  <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-0.5">Save & Export</h3>
                  <p className="text-[13px] text-[#555555]">Save this analysis to your workspace or export it for sharing.</p>
                </div>
                {[
                  { label: 'Save to Workspace', desc: 'Keep this report in your Saved Reports for future reference. Accessible from any device.', icon: Save,     cta: 'Save Report',   primary: true  },
                  { label: 'Export as PDF',      desc: 'Download a formatted PDF including all key points, missing items, and action steps.',    icon: Download, cta: 'Download PDF', primary: false },
                ].map((opt, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#E5E2DC] p-5 flex items-center gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: opt.primary ? '#EBF1FF' : '#F0EDE8', color: opt.primary ? '#2C4A7C' : '#555555', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <opt.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[13px] text-[#1A1A1A] mb-0.5">{opt.label}</h4>
                      <p className="text-[12px] text-[#555555] leading-relaxed">{opt.desc}</p>
                    </div>
                    <button className={`px-4 py-2 rounded-xl text-[12px] font-bold shrink-0 ${opt.primary ? 'pp-btn-primary' : 'pp-btn-outline'}`}>{opt.cta}</button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Pinned action bar */}
          <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-end items-center z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, #F8F7F4 60%, transparent)' }}>
            <div className="pointer-events-auto flex items-center gap-2.5">
              <button className="pp-btn-outline px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button className="pp-btn-primary px-6 py-2.5 rounded-xl text-[13.5px] font-bold flex items-center gap-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                <Save className="w-4 h-4" /> Save Analysis
              </button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
