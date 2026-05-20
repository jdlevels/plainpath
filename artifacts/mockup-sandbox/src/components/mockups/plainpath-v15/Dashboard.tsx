import React from 'react';
import {
  Search, Bell, Settings, LogOut,
  FileText, Home, FolderOpen, BarChart2,
  Plus, ArrowRight, Clock, MoreHorizontal,
  Sparkles, ShieldCheck, List, MessageSquare,
  Lock, ChevronRight, TrendingUp, CheckCircle2
} from 'lucide-react';
import './_group.css';

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  MSA:        { bg: '#EBF1FF', text: '#2C4A7C', border: '#C7D8F5', dot: '#4F7CAC' },
  Lease:      { bg: '#FFF3E0', text: '#B45309', border: '#FDE0B2', dot: '#D97706' },
  Employment: { bg: '#E8F5EE', text: '#2D7D4F', border: '#B6E5CB', dot: '#2D7D4F' },
  Vendor:     { bg: '#F3F0FF', text: '#6D4CB5', border: '#D8D0F5', dot: '#7C5CBF' },
  NDA:        { bg: '#F0EDE8', text: '#555555', border: '#D4D0C8', dot: '#888888' },
};

export function Dashboard() {
  return (
    <div className="plainpath-v15-theme flex min-h-screen" style={{ fontSize: 14 }}>

      {/* ── Sidebar ─────────────────────────── */}
      <aside className="w-60 border-r border-[var(--pp-border)] bg-[var(--pp-surface)] flex flex-col shrink-0" style={{ boxShadow: '1px 0 0 0 var(--pp-border)' }}>
        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-[var(--pp-border)]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2C4A7C 0%, #3A5E9A 100%)', boxShadow: '0 2px 8px rgba(44,74,124,0.40)' }}>
            <ShieldCheck size={14} strokeWidth={2.5} color="white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-[var(--pp-text-primary)]">PlainPath</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 pt-3">
          {/* Active nav item */}
          <a href="#" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold relative" style={{ background: 'linear-gradient(to right, #EBF1FF, #F0F5FF)', color: '#2C4A7C', boxShadow: 'inset 0 0 0 1px rgba(44,74,124,0.14), 0 1px 3px rgba(44,74,124,0.08)' }}>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: '#2C4A7C' }} />
            <Home size={15} strokeWidth={2.5} /> Workspace
          </a>
          {[
            { icon: FolderOpen, label: 'My Documents' },
            { icon: FileText,   label: 'Saved Reports' },
            { icon: BarChart2,  label: 'Usage & Analytics' },
          ].map(({ icon: Icon, label }) => (
            <a key={label} href="#" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg)] text-[13px] transition-colors font-medium">
              <Icon size={15} strokeWidth={1.8} /> {label}
            </a>
          ))}
        </nav>

        {/* Usage card */}
        <div className="mx-3 mb-3 p-4 rounded-xl border" style={{ background: 'linear-gradient(135deg, #F8F7F4 0%, #F0EDE8 100%)', borderColor: 'var(--pp-border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--pp-text-muted)] uppercase tracking-wider">Pro Plan</span>
            </div>
            <span className="text-[10px] font-bold text-[#2C4A7C] bg-[#EBF1FF] border border-[#C7D8F5] px-2 py-0.5 rounded-full">4 / 10</span>
          </div>
          <div className="w-full bg-[var(--pp-border)] rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="h-1.5 rounded-full" style={{ width: '40%', background: 'linear-gradient(to right, #2C4A7C, #4F7CAC)', boxShadow: '0 0 8px rgba(44,74,124,0.5)' }} />
          </div>
          <a href="#" className="text-[11px] text-[var(--pp-primary)] font-bold hover:underline flex items-center gap-1">
            Upgrade plan <ChevronRight size={11} />
          </a>
        </div>

        <div className="p-3 border-t border-[var(--pp-border)] space-y-0.5">
          {[{ icon: Settings, label: 'Settings' }, { icon: LogOut, label: 'Sign Out' }].map(({ icon: Icon, label }) => (
            <a key={label} href="#" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[var(--pp-text-muted)] hover:bg-[var(--pp-bg)] text-[13px] transition-colors font-medium">
              <Icon size={15} strokeWidth={1.8} /> {label}
            </a>
          ))}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 border-b border-[var(--pp-border)] bg-[var(--pp-surface)] flex items-center justify-between px-7 shrink-0 sticky top-0 z-10" style={{ boxShadow: '0 1px 0 var(--pp-border)' }}>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pp-text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search documents, reports, or clauses..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--pp-bg)] border border-[var(--pp-border)] rounded-lg text-[13px] focus:outline-none focus:border-[var(--pp-primary)] focus:ring-2 focus:ring-[#2C4A7C]/10 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-1.5 text-[var(--pp-text-muted)] hover:bg-[var(--pp-bg)] rounded-full relative transition-colors">
              <Bell size={17} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--pp-warning)] rounded-full border border-white" />
            </button>
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[11px] cursor-pointer" style={{ background: 'linear-gradient(135deg, #2C4A7C 0%, #3A5E9A 100%)', boxShadow: '0 0 0 2px #EBF1FF, 0 0 0 3px #C7D8F5' }}>
              JD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-7 pp-scrollbar bg-[var(--pp-bg)]">
          <div className="max-w-5xl mx-auto">

            {/* ── Page header ──────────────────── */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--pp-text-muted)] mb-2 flex items-center gap-1.5">
                    <span className="inline-block w-4 h-px bg-[var(--pp-border-strong)]" />
                    Document Intelligence Workspace
                  </p>
                  <h1 className="text-[26px] font-extrabold leading-tight tracking-tight mb-1" style={{ letterSpacing: '-0.6px' }}>Welcome back, John</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[var(--pp-text-muted)] text-[13px]">Wednesday, May 20</span>
                    <div className="flex items-center gap-3">
                      {[
                        { val: '4', label: 'analyses this week', color: '#2D7D4F' },
                        { val: '62', label: 'pages processed',    color: '#2C4A7C' },
                        { val: '3', label: 'reports saved',       color: '#6D4CB5' },
                      ].map(({ val, label, color }, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold" style={{ color }}>{val}</span>
                          <span className="text-[12px] text-[var(--pp-text-muted)]">{label}</span>
                          {i < 2 && <span className="text-[var(--pp-border-strong)]">·</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hero CTA */}
                <button className="pp-btn-primary flex items-center gap-2.5 rounded-xl text-[14px] font-bold" style={{ padding: '11px 22px' }}>
                  <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                    <Plus size={13} strokeWidth={3} />
                  </div>
                  New Analysis
                </button>
              </div>
              <div className="mt-6 h-px bg-[var(--pp-border)]" />
            </div>

            {/* ── Four-Tool Grid ─────────────────── */}
            <div className="mb-9">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pp-text-muted)]">Tools</h2>
                <div className="flex-1 h-px bg-[var(--pp-border)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Analyze — Active */}
                <div className="pp-card-tool-active cursor-pointer group overflow-hidden flex flex-col">
                  {/* Header band */}
                  <div className="px-5 pt-5 pb-4 flex items-start gap-4" style={{ borderBottom: '1px solid rgba(44,74,124,0.08)', background: 'linear-gradient(to bottom right, #FAFCFF, #F5F8FF)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #2C4A7C 0%, #4F7CAC 100%)', boxShadow: '0 4px 14px rgba(44,74,124,0.35)' }}>
                      <Sparkles size={20} strokeWidth={1.8} color="white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-[14.5px] group-hover:text-[var(--pp-primary)] transition-colors tracking-tight">Analyze a Document</h3>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ background: '#EBF1FF', color: '#2C4A7C', borderColor: '#C7D8F5' }}>Active</span>
                      </div>
                      <p className="text-[var(--pp-text-secondary)] text-[12.5px] leading-relaxed">Extract key terms, obligations, and plain-English summaries automatically.</p>
                    </div>
                  </div>
                  {/* CTA footer */}
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-[var(--pp-primary)] text-[12px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Start analysis <ArrowRight size={13} />
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--pp-text-muted)]">
                      <Clock size={10} /> Avg 45 sec
                    </div>
                  </div>
                </div>

                {/* Contract Review — Active */}
                <div className="pp-card-tool-active cursor-pointer group overflow-hidden flex flex-col" style={{ borderLeftColor: '#4F7CAC' }}>
                  <div className="px-5 pt-5 pb-4 flex items-start gap-4" style={{ borderBottom: '1px solid rgba(79,124,172,0.08)', background: 'linear-gradient(to bottom right, #FAFCFF, #F5F9FF)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #3D6199 0%, #4F7CAC 100%)', boxShadow: '0 4px 14px rgba(79,124,172,0.35)' }}>
                      <ShieldCheck size={20} strokeWidth={1.8} color="white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-[14.5px] group-hover:text-[var(--pp-primary)] transition-colors tracking-tight">Contract Review</h3>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ background: '#EBF1FF', color: '#2C4A7C', borderColor: '#C7D8F5' }}>Active</span>
                      </div>
                      <p className="text-[var(--pp-text-secondary)] text-[12.5px] leading-relaxed">Surface clauses worth discussing before you sign, in plain English.</p>
                    </div>
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-[var(--pp-primary)] text-[12px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Start review <ArrowRight size={13} />
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--pp-text-muted)]">
                      <Clock size={10} /> Avg 60 sec
                    </div>
                  </div>
                </div>

                {/* Clause Extractor — Coming Next */}
                <div className="relative rounded-[0.875rem] cursor-default overflow-hidden flex gap-4 p-5" style={{ background: '#FAFAF8', border: '1px solid var(--pp-border)', opacity: 0.62 }}>
                  <div className="absolute top-3 right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'white', border: '1px solid var(--pp-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    <Lock size={8} className="text-[var(--pp-text-muted)]" />
                    <span className="text-[9px] font-bold text-[var(--pp-text-muted)] uppercase tracking-wider">Coming Next</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F0EDE8', border: '1px solid var(--pp-border)' }}>
                    <List size={19} strokeWidth={1.5} color="#888" />
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="font-semibold text-[14px] mb-0.5 text-[var(--pp-text-secondary)]">Clause Extractor &amp; Obligations Tracker</h3>
                    <p className="text-[var(--pp-text-muted)] text-[12.5px] leading-relaxed">Pull every clause, deadline, and obligation into a structured tracker.</p>
                  </div>
                </div>

                {/* Ask This Document — Coming Next */}
                <div className="relative rounded-[0.875rem] cursor-default overflow-hidden flex gap-4 p-5" style={{ background: '#FAFAF8', border: '1px solid var(--pp-border)', opacity: 0.62 }}>
                  <div className="absolute top-3 right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'white', border: '1px solid var(--pp-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                    <Lock size={8} className="text-[var(--pp-text-muted)]" />
                    <span className="text-[9px] font-bold text-[var(--pp-text-muted)] uppercase tracking-wider">Coming Next</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F0EDE8', border: '1px solid var(--pp-border)' }}>
                    <MessageSquare size={19} strokeWidth={1.5} color="#888" />
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="font-semibold text-[14px] mb-0.5 text-[var(--pp-text-secondary)]">Ask This Document</h3>
                    <p className="text-[var(--pp-text-muted)] text-[12.5px] leading-relaxed">Ask plain-English questions directly about any document you've uploaded.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Content grid ─────────────────── */}
            <div className="grid grid-cols-3 gap-6">

              {/* Recent Analyses — col-span-2 */}
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pp-text-muted)]">Recent Analyses</h2>
                  <div className="flex-1 h-px bg-[var(--pp-border)]" />
                  <button className="text-[12px] text-[var(--pp-primary)] font-bold hover:underline flex items-center gap-1">
                    View all <ChevronRight size={11} />
                  </button>
                </div>

                <div className="pp-card-elevated overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--pp-border)] text-[10px] text-[var(--pp-text-muted)] uppercase tracking-[0.08em]" style={{ background: 'linear-gradient(to bottom, #FAFAF8, #F8F7F4)' }}>
                        <th className="px-5 py-3 font-bold">Document</th>
                        <th className="px-4 py-3 font-bold">Type</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold">Date</th>
                        <th className="px-4 py-3 font-bold text-right" />
                      </tr>
                    </thead>
                    <tbody className="text-[13px]">
                      {[
                        { name: 'Acme_Corp_MSA_2023.pdf',       type: 'MSA',        status: 'Complete',    date: 'Today, 10:42 AM', done: true  },
                        { name: 'SF_Office_Lease_Draft.docx',   type: 'Lease',      status: 'In Progress', date: 'Yesterday',       done: false },
                        { name: 'JSmith_Employment_Offer.pdf',  type: 'Employment', status: 'Complete',    date: 'Oct 12',          done: true  },
                        { name: 'Vendor_Agreement_Q4.pdf',      type: 'Vendor',     status: 'Complete',    date: 'Oct 10',          done: true  },
                      ].map((row, i, arr) => {
                        const tc = TYPE_COLORS[row.type] || TYPE_COLORS.NDA;
                        return (
                          <tr key={i} className={`hover:bg-[#FAFAF8] transition-colors cursor-pointer ${i < arr.length - 1 ? 'border-b border-[var(--pp-border)]' : ''}`}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                                  <FileText size={14} style={{ color: tc.text }} />
                                </div>
                                <span className="font-semibold truncate max-w-[160px] text-[var(--pp-text-primary)] text-[13px]">{row.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold" style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {row.done ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#E8F5EE', color: '#2D7D4F', border: '1px solid #B6E5CB' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D4F]" /> Complete
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FFF3E0', color: '#B45309', border: '1px solid #FDE0B2' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" /> In Progress
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-[var(--pp-text-muted)] text-[12px]">{row.date}</td>
                            <td className="px-4 py-4 text-right">
                              {row.done
                                ? <button className="pp-btn-outline px-3 py-1.5 rounded-lg text-[11px] font-bold">View Report</button>
                                : <button className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors p-1 rounded hover:bg-[var(--pp-bg)]"><MoreHorizontal size={15} /></button>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-7">

                {/* Saved Reports */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pp-text-muted)]">Saved Reports</h2>
                    <div className="flex-1 h-px bg-[var(--pp-border)]" />
                    <button className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--pp-text-muted)] hover:text-[var(--pp-primary)] hover:border-[var(--pp-primary)] transition-colors border border-[var(--pp-border)]" style={{ background: 'white' }}>
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: 'MSA Risk Summary',  company: 'Acme Corp',           type: 'MSA',   time: '2 days ago',  pages: 8  },
                      { title: 'Lease Obligations', company: 'SF Office',            type: 'Lease', time: '1 week ago',  pages: 14 },
                      { title: 'NDA Comparison',    company: 'TechCorp vs Standard', type: 'NDA',   time: '2 weeks ago', pages: 4  },
                    ].map((r, i) => {
                      const tc = TYPE_COLORS[r.type] || TYPE_COLORS.NDA;
                      return (
                        <div key={i} className="bg-white rounded-xl border border-[var(--pp-border)] cursor-pointer hover:shadow-[var(--pp-shadow-md)] transition-all group overflow-hidden flex" style={{ boxShadow: 'var(--pp-shadow-sm)' }}>
                          {/* Left accent stripe */}
                          <div className="w-1 shrink-0 rounded-l-xl" style={{ background: tc.dot }} />
                          <div className="flex items-center gap-3 px-3.5 py-3.5 flex-1 min-w-0">
                            <div className="w-9 h-10 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: tc.bg, borderColor: tc.border }}>
                              <FileText size={15} style={{ color: tc.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[12.5px] truncate group-hover:text-[var(--pp-primary)] transition-colors">{r.title}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0 rounded" style={{ background: tc.bg, color: tc.text }}>{r.type}</span>
                                <span className="text-[11px] text-[var(--pp-text-muted)] truncate">{r.company}</span>
                              </div>
                              <p className="text-[10.5px] text-[var(--pp-text-muted)] mt-0.5 flex items-center gap-1">
                                <Clock size={9} /> {r.time} · {r.pages}p
                              </p>
                            </div>
                            <ChevronRight size={13} className="text-[var(--pp-border-strong)] shrink-0 group-hover:text-[var(--pp-primary)] transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* This Week */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pp-text-muted)]">This Week</h2>
                    <div className="flex-1 h-px bg-[var(--pp-border)]" />
                  </div>
                  <div className="pp-card overflow-hidden">
                    {[
                      { label: 'Analyses run',    value: '4',  sub: '↑ 2 vs last week', subColor: '#2D7D4F', icon: TrendingUp },
                      { label: 'Pages processed', value: '62', sub: 'across 4 docs',     subColor: '#4F7CAC', icon: null       },
                      { label: 'Reports saved',   value: '3',  sub: null,                subColor: '',        icon: null       },
                    ].map((s, i, arr) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-4 ${i < arr.length - 1 ? 'border-b border-[var(--pp-border)]' : ''}`}>
                        <div>
                          <p className="text-[12px] text-[var(--pp-text-secondary)] font-medium mb-0.5">{s.label}</p>
                          {s.sub && (
                            <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: s.subColor }}>
                              {s.icon && <s.icon size={9} />}
                              {s.sub}
                            </p>
                          )}
                        </div>
                        <span className="text-[22px] font-extrabold tracking-tight" style={{ color: i === 0 ? '#2D7D4F' : i === 1 ? '#2C4A7C' : 'var(--pp-text-primary)' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
