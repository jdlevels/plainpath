import React from 'react';
import {
  FileText, ShieldCheck, Home, BarChart2, User,
  ChevronRight, Clock, FileCheck2, FileSignature,
  Lock, Sparkles, List, MessageSquare, Plus
} from 'lucide-react';
import './_group.css';

const NAV = [
  { Icon: Home,       label: 'Home',    active: true  },
  { Icon: ShieldCheck,label: 'Review',  active: false },
  { Icon: BarChart2,  label: 'Reports', active: false },
  { Icon: User,       label: 'Account', active: false },
];

export function DashboardMobile() {
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  }).format(new Date());

  return (
    <div style={{
      width: 390, height: 844, overflow: 'hidden',
      background: '#F8F7F4', color: '#1A1A1A',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative', display: 'flex', flexDirection: 'column'
    }}>
      {/* Status bar */}
      <div style={{ height: 44, background: '#F8F7F4', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px 6px', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="#1A1A1A"><rect x="0" y="3" width="3" height="8" rx="1"/><rect x="4.5" y="2" width="3" height="9" rx="1"/><rect x="9" y="0.5" width="3" height="10.5" rx="1"/><rect x="13.5" y="0" width="2" height="11" rx="0.5" opacity="0.3"/></svg>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 92 }} className="no-scrollbar">

        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px', position: 'sticky', top: 0, background: 'rgba(248,247,244,0.94)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: '1px solid rgba(229,226,220,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2C4A7C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(44,74,124,0.35)' }}>
              <ShieldCheck size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.4px' }}>PlainPath</span>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2C4A7C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #EBF1FF, 0 0 0 3.5px #C7D8F5' }}>
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>JD</span>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: '18px 20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#888888', textTransform: 'uppercase', marginBottom: 4 }}>Document Intelligence Workspace</p>
          <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.6px', color: '#1A1A1A', marginBottom: 2, lineHeight: 1.2 }}>Good morning, John</h1>
          <p style={{ fontSize: 13, color: '#888888', fontWeight: 500 }}>{currentDate}</p>
        </div>

        {/* Tools section */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#888888', textTransform: 'uppercase' }}>Tools</p>
            <div style={{ flex: 1, height: 1, background: '#E5E2DC' }} />
          </div>

          {/* Primary: Analyze */}
          <button style={{
            width: '100%', borderRadius: 18, padding: '18px', display: 'flex', alignItems: 'flex-start', gap: 14,
            marginBottom: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'linear-gradient(135deg, #2C4A7C 0%, #3D6199 100%)',
            boxShadow: '0 6px 20px rgba(44,74,124,0.28), 0 2px 6px rgba(44,74,124,0.15)'
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
              <Sparkles size={23} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 17, marginBottom: 4, letterSpacing: '-0.3px' }}>Analyze a Document</p>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.45 }}>Extract key terms and plain-English summaries instantly.</p>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Plus size={16} color="white" />
            </div>
          </button>

          {/* Secondary: Contract Review */}
          <button style={{
            width: '100%', borderRadius: 18, padding: '18px', display: 'flex', alignItems: 'flex-start', gap: 14,
            marginBottom: 16, border: '1px solid #E5E2DC', cursor: 'pointer', textAlign: 'left',
            background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, #F0F5FB 0%, #E3EDF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #D6E4EF' }}>
              <ShieldCheck size={23} color="#4F7CAC" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#1A1A1A', fontWeight: 700, fontSize: 17, marginBottom: 4, letterSpacing: '-0.3px' }}>Contract Review</p>
              <p style={{ color: '#888888', fontSize: 13, lineHeight: 1.45 }}>Surface clauses worth discussing before you sign.</p>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center' }}>
              <ChevronRight size={16} color="#888888" />
            </div>
          </button>

          {/* Coming Soon row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
            {[
              { icon: List,         label: 'Clause Extractor',   sub: 'Obligations Tracker' },
              { icon: MessageSquare,label: 'Ask This Document',   sub: '' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} style={{
                flex: 1, background: '#FAFAF8', borderRadius: 16, padding: '14px 12px',
                border: '1px solid #E5E2DC', opacity: 0.6, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'white', border: '1px solid #E5E2DC', borderRadius: 20, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Lock size={8} color="#888888" />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soon</span>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={18} color="#888888" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#555555', lineHeight: 1.3 }}>{label}</p>
                {sub && <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Recent</h2>
            </div>
            <button style={{ fontSize: 14, fontWeight: 700, color: '#2C4A7C', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              See all <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E2DC', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)' }}>
            {[
              { Icon: FileCheck2,   iconBg: '#2C4A7C', iconColor: 'white',    name: 'Acme Corp NDA_v2.pdf',  tag: 'NDA',      tagBg: '#EBF1FF', tagColor: '#2C4A7C', time: '2h ago'   },
              { Icon: FileSignature,iconBg: '#EBF1FF', iconColor: '#4F7CAC',  name: 'Q3 Vendor Agreement',   tag: 'CONTRACT', tagBg: '#F0F5FB', tagColor: '#4F7CAC', time: 'Yesterday'},
              { Icon: FileText,     iconBg: '#F0EDE8', iconColor: '#888888',  name: 'Employee Handbook 2024',tag: 'POLICY',   tagBg: '#F0EDE8', tagColor: '#888888', time: 'Oct 12'   },
            ].map(({ Icon, iconBg, iconColor, name, tag, tagBg, tagColor, time }, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none', cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={19} color={iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                    <span style={{ background: tagBg, color: tagColor, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, letterSpacing: '0.04em' }}>{tag}</span>
                    <span style={{ fontSize: 12, color: '#888888', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} color="#888888" /> {time}
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} color="#D4D0C8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E5E2DC', paddingBottom: 24, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 8 }}>
          {NAV.map(({ Icon, label, active }, i) => (
            <button key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 64, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: -1, width: 20, height: 3, borderRadius: 2, background: '#2C4A7C' }} />}
              <Icon size={22} color={active ? '#2C4A7C' : '#999999'} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#2C4A7C' : '#999999' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
