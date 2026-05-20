import React from "react";
import {
  ArrowLeft, Share, CheckCircle2, ChevronRight,
  FileWarning, Home, ShieldCheck, BarChart2, User,
  Download, Hash, FileText, ListChecks, BookOpen
} from "lucide-react";
import "./_group.css";

const NAV = [
  { Icon: Home,        label: 'Home',    active: false },
  { Icon: ShieldCheck, label: 'Review',  active: false },
  { Icon: BarChart2,   label: 'Reports', active: true  },
  { Icon: User,        label: 'Account', active: false },
];

export function AnalyzeMobile() {
  return (
    <div style={{ width: 390, height: 844, overflow: 'hidden', background: '#F8F7F4', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', display: 'flex', flexDirection: 'column', color: '#1A1A1A' }}>

      {/* Status bar */}
      <div style={{ height: 44, background: 'white', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px 6px', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="#1A1A1A"><rect x="0" y="3" width="3" height="8" rx="1"/><rect x="4.5" y="2" width="3" height="9" rx="1"/><rect x="9" y="0.5" width="3" height="10.5" rx="1"/><rect x="13.5" y="0" width="2" height="11" rx="0.5" opacity="0.3"/></svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E2DC', padding: '10px 16px 14px', flexShrink: 0, boxShadow: '0 1px 0 #E5E2DC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#F8F7F4', border: '1px solid #E5E2DC', cursor: 'pointer', marginLeft: -4 }}>
            <ArrowLeft size={20} color="#1A1A1A" />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: '#1A1A1A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Lease Agreement.pdf</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <CheckCircle2 size={12} color="#2D7D4F" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2D7D4F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Analysis Complete</span>
            </div>
          </div>
          <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#EBF1FF', border: '1px solid #C7D8F5', cursor: 'pointer', marginRight: -4 }}>
            <Share size={17} color="#2C4A7C" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E2DC', flexShrink: 0 }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 18 }} className="no-scrollbar">
          {[
            { label: 'Summary',        active: true,  badge: undefined },
            { label: 'Source Sections',active: false, badge: undefined },
            { label: 'Missing Items',  active: false, badge: '2'       },
            { label: 'Action Plan',    active: false, badge: undefined },
          ].map(({ label, active, badge }, i) => (
            <button key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '12px 0 11px',
              fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? '#2C4A7C' : '#888888',
              whiteSpace: 'nowrap', background: 'none', border: 'none',
              borderBottom: active ? '2.5px solid #2C4A7C' : '2.5px solid transparent',
              cursor: 'pointer', position: 'relative', top: 1, flexShrink: 0
            }}>
              {label}
              {badge && <span style={{ background: '#FFF3E0', color: '#B45309', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', paddingBottom: 150 }} className="no-scrollbar">

        {/* Summary card — accent border */}
        <div style={{ background: 'white', borderRadius: 18, padding: '18px', border: '1px solid #C7D8F5', borderTop: '3px solid #2C4A7C', boxShadow: '0 2px 12px rgba(44,74,124,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BookOpen size={14} color="#4F7CAC" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#4F7CAC', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plain English Summary</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#1A1A1A' }}>
            This is a standard 12-month residential lease for unit 4B at 123 Main St. Rent is <strong>$2,400/month</strong> due on the 1st, with a <strong>$2,400 security deposit</strong>. The landlord covers water and trash; you pay electricity and internet. No pets without written consent.
          </p>
        </div>

        {/* Key Points */}
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', marginBottom: 12, paddingLeft: 2 }}>Key Points</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { text: 'Early termination requires 60 days notice and a penalty equal to one month\'s rent.', page: 'p. 4' },
              { text: 'Late fee of $50 applies if rent is not received by the 5th of the month.', page: 'p. 2' },
              { text: 'Tenant is responsible for minor maintenance under $50.', page: 'p. 6' },
            ].map((pt, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '13px 14px', border: '1px solid #E5E2DC', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EBF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2C4A7C', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                <p style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: '#1A1A1A' }}>{pt.text}</p>
                <span style={{ background: '#EBF1FF', color: '#2C4A7C', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Hash size={9} />{pt.page}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Items */}
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', marginBottom: 12, paddingLeft: 2 }}>What's Missing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { title: 'No landlord emergency contact',      detail: 'A 24/7 maintenance number is standard in most residential leases.' },
              { title: 'Deposit return timeline not specified', detail: 'The agreement doesn\'t state how many days after move-out you\'ll receive your deposit.' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#FFF8F0', borderRadius: 14, padding: '14px', border: '1px solid #FDE0B2', display: 'flex', gap: 10, boxShadow: '0 1px 4px rgba(180,83,9,0.07)' }}>
                <FileWarning size={17} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.45 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan preview */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 2 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Action Plan</h3>
            <button style={{ fontSize: 14, fontWeight: 700, color: '#2C4A7C', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              View full <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E2DC', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {[
              'Ask landlord to add a 24/7 emergency maintenance number.',
              'Clarify deposit return timeline — request 14–30 days in writing.',
              'Photograph all pre-existing damage before moving in.',
            ].map((action, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none', opacity: i === 2 ? 0.4 : 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #D4D0C8', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.45 }}>{action}</p>
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, white, transparent)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Export button */}
      <div style={{ position: 'absolute', bottom: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 20 }}>
        <button style={{ pointerEvents: 'auto', background: 'linear-gradient(135deg, #2C4A7C 0%, #3D6199 100%)', color: 'white', padding: '14px 30px', borderRadius: 30, fontWeight: 700, fontSize: 15, boxShadow: '0 8px 24px rgba(44,74,124,0.32)', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
          <Download size={17} /> Export Report
        </button>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E5E2DC', paddingBottom: 24, zIndex: 30 }}>
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
