import React, { useState } from 'react';
import {
  CheckCircle2, ChevronDown, FileText, HelpCircle,
  AlertCircle, Info, File, Search, Download, Save,
  ArrowRight, Scale, MessageSquare, ClipboardCheck,
  Loader2, ShieldCheck
} from 'lucide-react';
import './_group.css';

type Tab = 'Summary' | 'Key Clauses' | 'Needs Attention' | 'Balanced Clauses' | 'Questions to Ask' | 'Suggested Language' | 'Before You Sign';

export function ContractWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('Key Clauses');

  const tabs: { id: Tab; badge?: string; badgeActive?: string; badgeInactive?: string }[] = [
    { id: 'Summary' },
    { id: 'Key Clauses' },
    { id: 'Needs Attention',  badge: '3', badgeActive: '#FFF3E0|#B45309', badgeInactive: '#FFF3E0|#B45309' },
    { id: 'Balanced Clauses', badge: '4', badgeActive: '#E8F5EE|#2D7D4F', badgeInactive: '#E8F5EE|#2D7D4F' },
    { id: 'Questions to Ask' },
    { id: 'Suggested Language' },
    { id: 'Before You Sign',  badge: '5', badgeActive: '#EBF1FF|#2C4A7C', badgeInactive: '#F0EDE8|#888888' },
  ];

  const getBadge = (tab: typeof tabs[0]) => {
    if (!tab.badge) return null;
    const isActive = activeTab === tab.id;
    const style = isActive ? tab.badgeActive : tab.badgeInactive;
    const [bg, text] = (style || '').split('|');
    return { badge: tab.badge, bg, text };
  };

  return (
    <div className="flex flex-col h-screen w-full text-[#1A1A1A] bg-[#F8F7F4] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14 }}>

      {/* ── Top bar ────────────────────────────── */}
      <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-[#E5E2DC] shrink-0" style={{ boxShadow: '0 1px 0 #E5E2DC' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-[15px]" style={{ color: '#2C4A7C' }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#2C4A7C', boxShadow: '0 2px 6px rgba(44,74,124,0.35)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            PlainPath
          </div>
          <div className="h-4 w-px bg-[#E5E2DC]" />
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1A1A]">
            <FileText size={14} className="text-[#888888]" />
            Employment Contract — Acme Corp.pdf
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ background: '#E8F5EE', color: '#2D7D4F', borderColor: '#B6E5CB' }}>
            <CheckCircle2 size={12} /> Review Complete
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#888888] hover:text-[#1A1A1A] transition-colors p-1.5 rounded-lg hover:bg-[#F8F7F4]"><Search size={16} /></button>
          <div className="h-8 w-8 rounded-full text-white flex items-center justify-center font-bold text-[11px] cursor-pointer" style={{ background: '#2C4A7C', boxShadow: '0 0 0 2px #EBF1FF, 0 0 0 3px #C7D8F5' }}>JD</div>
        </div>
      </header>

      {/* ── Workspace ──────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Left: Contract Viewer */}
        <section className="w-[44%] h-full flex flex-col border-r border-[#E5E2DC] bg-[#F0EDE8]/40 relative">
          <div className="flex-1 overflow-y-auto p-6 pp-scrollbar">
            <div className="max-w-[540px] mx-auto bg-white rounded-xl pb-20 relative" style={{ border: '1px solid #E5E2DC', boxShadow: 'var(--pp-shadow-paper)' }}>
              <div className="px-8 pt-8 pb-4">
                <h2 className="text-[15px] font-bold mb-5 text-center tracking-wide uppercase">Employment Agreement</h2>

                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  This Employment Agreement (the "Agreement") is made and entered into as of October 1, 2023 by and between Acme Corp, a Delaware corporation (the "Company"), and Jane Doe, an individual residing at 456 Market St, San Francisco, CA (the "Employee").
                </p>

                <h3 className="font-bold mt-5 mb-2 text-[11.5px] text-[#1A1A1A] border-b border-[#E5E2DC] pb-1.5">1. Position and Duties</h3>
                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  The Company employs Employee as Senior Software Engineer, reporting to the Director of Engineering. Employee accepts and agrees to perform all duties assigned to the best of their abilities.
                </p>

                <h3 className="font-bold mt-5 mb-2 text-[11.5px] text-[#1A1A1A] border-b border-[#E5E2DC] pb-1.5">2. Compensation</h3>
                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  <span className="rounded px-1 py-0.5 inline" style={{ background: 'rgba(45,125,79,0.10)', border: '1px solid rgba(45,125,79,0.18)' }}>
                    Base salary of $160,000/year, payable per standard payroll. Eligible for annual performance bonus of up to 15% of base salary.
                  </span>
                </p>

                <h3 className="font-bold mt-5 mb-2 text-[11.5px] text-[#1A1A1A] border-b border-[#E5E2DC] pb-1.5">3. Non-Competition</h3>
                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  <span className="rounded px-1 py-0.5 inline cursor-pointer transition-colors" style={{ background: 'rgba(180,83,9,0.10)', border: '1px solid rgba(180,83,9,0.18)' }}>
                    For a period of eighteen (18) months following termination of employment for any reason, Employee shall not directly or indirectly engage in any business that competes with the Company within the United States.
                  </span>
                </p>

                <h3 className="font-bold mt-5 mb-2 text-[11.5px] text-[#1A1A1A] border-b border-[#E5E2DC] pb-1.5">4. Confidentiality and IP Assignment</h3>
                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  All inventions, improvements, and works of authorship made by Employee during the term of employment that relate to the Company's business shall be the sole and exclusive property of the Company.
                </p>

                <h3 className="font-bold mt-5 mb-2 text-[11.5px] text-[#1A1A1A] border-b border-[#E5E2DC] pb-1.5">5. Termination</h3>
                <p className="text-[11.5px] leading-relaxed mb-4 text-[#555555]">
                  <span className="rounded px-1 py-0.5 inline" style={{ background: 'rgba(45,125,79,0.10)', border: '1px solid rgba(45,125,79,0.18)' }}>
                    At-will employment. Either party may terminate with thirty (30) days written notice.
                  </span>
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-24 rounded-b-xl pointer-events-none" style={{ background: 'linear-gradient(to top, white, transparent)' }} />
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-bold text-[#555555]" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid #E5E2DC', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            Page 2 of 7
          </div>
        </section>

        {/* Right: Intelligence Panel */}
        <section className="w-[56%] h-full flex flex-col bg-white">

          {/* Tabs */}
          <div className="flex items-end gap-0 px-4 pt-3 border-b border-[#E5E2DC] shrink-0 overflow-x-auto no-scrollbar" style={{ boxShadow: '0 1px 0 #E5E2DC' }}>
            {tabs.map((tab) => {
              const b = getBadge(tab);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-semibold transition-all relative whitespace-nowrap shrink-0 ${
                    isActive ? 'text-[#2C4A7C]' : 'text-[#888888] hover:text-[#1A1A1A]'
                  }`}
                >
                  {tab.id}
                  {b && (
                    <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none" style={{ background: b.bg, color: b.text }}>{b.badge}</span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t" style={{ background: '#2C4A7C' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6 pp-scrollbar pb-24">
            <div className="max-w-[640px]">

              {activeTab === 'Summary' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Summary</h2>
                    <p className="text-[#555555] text-[13px]">A plain-English overview of this contract.</p>
                  </div>
                  <div className="rounded-xl border border-[#C7D8F5] border-l-[3px] border-l-[#2C4A7C] bg-white p-5" style={{ boxShadow: '0 2px 12px rgba(44,74,124,0.08)' }}>
                    <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
                      This is an employment agreement with Acme Corp for a Senior Software Engineer role, effective October 1, 2023. You'll receive a base salary of <strong>$160,000/year</strong> with a bonus potential of up to 15%. The agreement is at-will with 30-day notice on either side. There are a few clauses — particularly the 18-month non-compete and broad IP assignment — that are worth discussing before you sign.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Contract Type', value: 'Employment Agreement' },
                      { label: 'Effective Date',  value: 'October 1, 2023'   },
                      { label: 'Pages',           value: '7'                  },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl p-3 text-center border" style={{ background: '#FAFAF8', borderColor: '#E5E2DC', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#888888] mb-1">{s.label}</p>
                        <p className="text-[13px] font-bold text-[#1A1A1A]">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Key Clauses' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Key Clauses</h2>
                    <p className="text-[#555555] text-[13px]">Plain-English summaries of the most important terms in this contract.</p>
                  </div>

                  {[
                    {
                      icon: AlertCircle,
                      iconBg: '#FFF3E0', iconColor: '#B45309',
                      headerBg: 'linear-gradient(to right, #FFF8F0, #FAFAF8)',
                      title: 'Non-Compete (18 months)',
                      ref: 'Clause 3 · Page 2',
                      plain: 'You cannot work for any competitor anywhere in the United States for 1.5 years after leaving this job, for any reason.',
                      note: 'Worth discussing.',
                      noteDetail: '18 months is longer than the 12-month standard commonly seen in similar roles. In California, non-competes are largely unenforceable — worth confirming with an attorney based on your state.',
                    },
                    {
                      icon: FileText,
                      iconBg: '#F0EDE8', iconColor: '#555555',
                      headerBg: 'linear-gradient(to right, #FAFAF8, #FAFAF8)',
                      title: 'Termination Without Cause',
                      ref: 'Clause 5 · Page 2',
                      plain: 'The company can end your employment at any time for any reason, provided they give 30 days written notice.',
                      note: 'Standard term.',
                      noteDetail: '30 days notice is a balanced and common approach for at-will roles at this level.',
                    },
                    {
                      icon: FileText,
                      iconBg: '#F0EDE8', iconColor: '#555555',
                      headerBg: 'linear-gradient(to right, #FAFAF8, #FAFAF8)',
                      title: 'IP Assignment',
                      ref: 'Clause 4 · Page 2',
                      plain: 'The company owns anything you invent, design, or create during your employment that relates to their business — even if done in your own time.',
                      note: 'May want to clarify.',
                      noteDetail: 'If you have pre-existing side projects or personal work in this industry, request a written exclusion in an addendum before signing.',
                    },
                  ].map((clause, i) => (
                    <div key={i} className="rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow" style={{ border: '1px solid #E5E2DC', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E2DC]" style={{ background: clause.headerBg }}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: clause.iconBg }}>
                            <clause.icon size={14} style={{ color: clause.iconColor }} />
                          </div>
                          <h3 className="font-bold text-[#1A1A1A] text-[13px]">{clause.title}</h3>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#888888] bg-white border border-[#E5E2DC] px-2 py-0.5 rounded-full">{clause.ref}</span>
                      </div>
                      <div className="p-5 bg-white">
                        <p className="text-[#1A1A1A] text-[13px] mb-3.5 leading-relaxed">{clause.plain}</p>
                        <div className="flex items-start gap-2 p-3.5 rounded-xl border" style={{ background: '#F8F7F4', borderColor: '#E5E2DC' }}>
                          <Info size={14} className="text-[#4F7CAC] shrink-0 mt-0.5" />
                          <p className="text-[12px] text-[#555555] leading-relaxed">
                            <span className="font-bold text-[#1A1A1A]">{clause.note} </span>{clause.noteDetail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Needs Attention' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Needs Attention</h2>
                    <p className="text-[#555555] text-[13px]">Three clauses worth reviewing and potentially discussing before you sign.</p>
                  </div>
                  {[
                    {
                      title: 'Non-Compete Period',
                      detail: '18 months is longer than the standard 12 months for this type of role. Depending on your state, this may or may not be enforceable, but it\'s worth negotiating before signing.',
                      ref: 'Clause 3 · Page 2',
                    },
                    {
                      title: 'Broad IP Assignment Scope',
                      detail: 'The assignment covers work done on your own time if it relates to the company\'s business. The phrase "relates to the company\'s business" is wide — a carve-out for personal projects is common and reasonable to request.',
                      ref: 'Clause 4 · Page 2',
                    },
                    {
                      title: 'No Severance on Termination Without Cause',
                      detail: 'The agreement permits termination with 30 days notice but does not specify any severance payment. This is legal and common, but it is often negotiated, especially for senior roles.',
                      ref: 'Clause 5 · Page 3',
                    },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-5" style={{ background: '#FFF8F0', border: '1px solid #FDE0B2', boxShadow: '0 1px 4px rgba(180,83,9,0.07)' }}>
                      <div className="flex items-start gap-3 mb-2.5">
                        <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                        <h4 className="font-bold text-[#92400E] text-[14px]">{item.title}</h4>
                      </div>
                      <p className="text-[12px] text-[#B45309] leading-relaxed ml-7 mb-3">{item.detail}</p>
                      <span className="ml-7 inline-flex items-center text-[10px] font-bold text-[#888888] bg-white border border-[#E5E2DC] px-2.5 py-1 rounded-full">{item.ref}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Balanced Clauses' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Balanced Clauses</h2>
                    <p className="text-[#555555] text-[13px]">Terms that are fair, standard, and consistent with what you'd expect in an agreement like this.</p>
                  </div>
                  {[
                    {
                      title: 'Compensation & Bonus Structure',
                      detail: '$160,000 base with up to 15% annual bonus is a competitive and standard compensation structure for a Senior Software Engineer at a Series B+ company in San Francisco.',
                      ref: 'Clause 2 · Page 1',
                    },
                    {
                      title: 'Termination Notice Period',
                      detail: '30-day written notice on both sides is a fair and balanced arrangement. You have the same right to give notice as the company.',
                      ref: 'Clause 5 · Page 2',
                    },
                    {
                      title: 'Confidentiality Scope',
                      detail: 'The confidentiality clause covers business information, client data, and trade secrets. The scope is reasonable and consistent with industry norms for this role.',
                      ref: 'Clause 6 · Page 3',
                    },
                    {
                      title: 'Governing Law',
                      detail: 'California law governs this agreement, which is appropriate given the location of both parties. California also provides strong worker protections, including on non-compete enforceability.',
                      ref: 'Clause 12 · Page 6',
                    },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-5" style={{ background: '#F0FBF4', border: '1px solid #B6E5CB', boxShadow: '0 1px 4px rgba(45,125,79,0.07)' }}>
                      <div className="flex items-start gap-3 mb-2.5">
                        <Scale className="w-4 h-4 text-[#2D7D4F] shrink-0 mt-0.5" />
                        <h4 className="font-bold text-[#1A3D28] text-[14px]">{item.title}</h4>
                      </div>
                      <p className="text-[12px] text-[#2D7D4F] leading-relaxed ml-7 mb-3">{item.detail}</p>
                      <span className="ml-7 inline-flex items-center text-[10px] font-bold text-[#888888] bg-white border border-[#E5E2DC] px-2.5 py-1 rounded-full">{item.ref}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Questions to Ask' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Questions to Ask</h2>
                    <p className="text-[#555555] text-[13px]">Consider raising these points in writing before you sign.</p>
                  </div>
                  {[
                    { q: '"Regarding the 18-month non-compete in Clause 3, would the company be open to reducing this to 12 months, which is more typical for roles at this level?"', context: 'Related to: Non-Compete · Clause 3' },
                    { q: '"I maintain a personal open-source project in my own time. Can we add a written exclusion to the IP Assignment clause to protect pre-existing personal work?"', context: 'Related to: IP Assignment · Clause 4' },
                    { q: '"Is there flexibility to add a severance provision — for example, 4–8 weeks of base salary — in the event of termination without cause?"', context: 'Related to: Termination · Clause 5' },
                    { q: '"Can you confirm whether this agreement includes an equity or stock option component, and if so, what are the vesting schedule and cliff terms?"', context: 'General compensation clarification' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white border border-[#E5E2DC] rounded-xl p-4 hover:border-[#4F7CAC]/50 hover:shadow-[0_2px_10px_rgba(44,74,124,0.07)] transition-all">
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-[#4F7CAC] text-[14px] mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px]" style={{ background: '#EBF1FF' }}>{i + 1}</span>
                        <div>
                          <p className="text-[13px] text-[#1A1A1A] leading-relaxed mb-2">{item.q}</p>
                          <span className="text-[11px] font-semibold text-[#888888] flex items-center gap-1">
                            <HelpCircle size={11} /> {item.context}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Suggested Language' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Suggested Language to Discuss</h2>
                    <p className="text-[#555555] text-[13px]">Optional language you could propose. These are starting points for conversation — not legal advice.</p>
                  </div>
                  {[
                    {
                      title: 'Shorter Non-Compete Period',
                      original: 'Employee shall not… for a period of eighteen (18) months…',
                      suggested: 'Employee shall not… for a period of twelve (12) months…',
                      note: 'Reduces the restriction to the more common industry standard.',
                    },
                    {
                      title: 'Personal Project Carve-Out',
                      original: '[No carve-out present in current Clause 4]',
                      suggested: '"Notwithstanding the foregoing, Employee retains all rights to any invention or creative work that (a) was developed entirely on Employee\'s own time without using Company equipment, and (b) does not relate directly to the Company\'s current products or demonstrably anticipated research."',
                      note: 'Standard carve-out language for pre-existing or unrelated personal projects.',
                    },
                    {
                      title: 'Severance on Termination Without Cause',
                      original: '[No severance provision present]',
                      suggested: '"In the event of termination without cause, Company shall pay Employee a severance of four (4) weeks of base salary per year of completed service, up to a maximum of twelve (12) weeks, contingent upon execution of a release."',
                      note: 'A modest and common addition for a senior role.',
                    },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E2DC', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div className="px-5 py-3.5 border-b border-[#E5E2DC] flex items-center gap-2" style={{ background: 'linear-gradient(to right, #FAFAF8, #F8F7F4)' }}>
                        <MessageSquare size={14} className="text-[#4F7CAC]" />
                        <h4 className="font-bold text-[13px] text-[#1A1A1A]">{item.title}</h4>
                      </div>
                      <div className="p-5 space-y-3.5 bg-white">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1.5">Current language</p>
                          <p className="text-[12px] text-[#555555] italic rounded-lg p-3 leading-relaxed" style={{ background: '#F8F7F4', border: '1px solid #E5E2DC' }}>"{item.original}"</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#2D7D4F] mb-1.5">Suggested addition or change</p>
                          <p className="text-[12px] text-[#1A1A1A] rounded-lg p-3 leading-relaxed" style={{ background: '#F0FBF4', border: '1px solid #B6E5CB' }}>"{item.suggested}"</p>
                        </div>
                        <p className="text-[11px] text-[#888888] flex items-start gap-1.5">
                          <Info size={12} className="text-[#4F7CAC] shrink-0 mt-0.5" />{item.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Before You Sign' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-0.5">Before You Sign</h2>
                    <p className="text-[#555555] text-[13px]">A final checklist to work through before returning the signed agreement.</p>
                  </div>
                  {[
                    { done: true,  item: 'Read the full contract, not just the summary.',                                                       note: null },
                    { done: false, item: 'Decide whether to negotiate the non-compete period (Clause 3).',                                      note: 'See Suggested Language tab for wording.' },
                    { done: false, item: 'Request a personal project carve-out in writing if applicable (Clause 4).',                           note: null },
                    { done: false, item: 'Confirm whether equity or stock options are part of the package.',                                    note: 'Not mentioned in the current contract.' },
                    { done: false, item: 'Share the agreement with a lawyer in your state if you have concerns about non-compete enforceability.', note: 'PlainPath is not a law firm and this is not legal advice.' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-xl p-4 flex items-start gap-3.5 transition-colors border ${item.done ? 'border-[#B6E5CB]' : 'border-[#E5E2DC] hover:border-[#4F7CAC]/40'}`} style={{ background: item.done ? '#F0FBF4' : 'white' }}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${item.done ? 'border-[#2D7D4F] bg-[#2D7D4F]' : 'border-[#D4D0C8]'}`}>
                        {item.done && <CheckCircle2 size={11} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-[13px] leading-relaxed ${item.done ? 'text-[#2D7D4F] line-through' : 'text-[#1A1A1A]'}`}>{item.item}</p>
                        {item.note && <p className="text-[11px] text-[#888888] mt-1.5 flex items-center gap-1"><Info size={11} className="text-[#4F7CAC]" /> {item.note}</p>}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 pp-btn-outline py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2">
                      <Download size={15} /> Export
                    </button>
                    <button className="flex-1 pp-btn-primary py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2">
                      <Save size={15} /> Save Review
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
