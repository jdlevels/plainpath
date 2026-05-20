import React from "react";
import {
  ArrowLeft, Share, CheckCircle2, ChevronRight,
  Home, ShieldCheck, BarChart2, User,
  AlertCircle, MessageSquare, FileText
} from "lucide-react";
import "./_group.css";

const NAV = [
  { Icon: Home,        label: 'Home',    active: false },
  { Icon: ShieldCheck, label: 'Review',  active: true  },
  { Icon: BarChart2,   label: 'Reports', active: false },
  { Icon: User,        label: 'Account', active: false },
];

const TABS = [
  { label: 'Summary',       active: false, badge: undefined   },
  { label: 'Key Clauses',   active: false, badge: undefined   },
  { label: 'Needs Attention', active: true, badge: '3'        },
  { label: 'Balanced',      active: false, badge: '4'         },
  { label: 'Questions',     active: false, badge: undefined   },
  { label: 'Before You Sign', active: false, badge: '5'       },
];

export function ContractMobile() {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#F8F7F4', border: '1px solid #E5E2DC', cursor: 'pointer', marginLeft: -4 }}>
            <ArrowLeft size={20} color="#1A1A1A" />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: '#1A1A1A' }}>Employment Contract.pdf</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <CheckCircle2 size={12} color="#2D7D4F" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2D7D4F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Review Complete</span>
            </div>
          </div>
          <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#EBF1FF', border: '1px solid #C7D8F5', cursor: 'pointer', marginRight: -4 }}>
            <Share size={17} color="#2C4A7C" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E2DC', flexShrink: 0 }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 16 }} className="no-scrollbar">
          {TABS.map(({ label, active, badge }, i) => (
            <button key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '12px 0 11px', fontSize: 13.5,
              fontWeight: active ? 700 : 500,
              color: active ? '#2C4A7C' : '#888888',
              whiteSpace: 'nowrap', background: 'none', border: 'none',
              borderBottom: active ? '2.5px solid #2C4A7C' : '2.5px solid transparent',
              cursor: 'pointer', position: 'relative', top: 1, flexShrink: 0
            }}>
              {label}
              {badge && (
                <span style={{
                  background: active ? '#2C4A7C' : '#F0EDE8',
                  color: active ? 'white' : '#888888',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8
                }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', paddingBottom: 155 }} className="no-scrollbar">

        <p style={{ fontSize: 13, color: '#888888', fontWeight: 500, marginBottom: 16, paddingLeft: 2 }}>
          Three clauses worth reviewing and discussing before you sign.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { title: 'Non-Compete Period',   tag: 'Worth discussing',   detail: 'Restricts you from working for competitors for 18 months after leaving — longer than the 12-month standard for similar roles.', ref: 'Clause 3 · Page 2' },
            { title: 'IP Assignment Scope',  tag: 'May want to clarify', detail: 'Broadly claims ownership of ideas developed on your own time that relate to the company\'s business. A personal project carve-out is common to request.', ref: 'Clause 4 · Page 2' },
            { title: 'No Severance Terms',   tag: 'Worth discussing',   detail: 'Termination without cause has no guaranteed severance. This is legal but often negotiated at the senior level.', ref: 'Clause 5 · Page 3' },
          ].map(({ title, tag, detail, ref }, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #E5E2DC', boxShadow: '0 2px 10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', flex: 1, paddingRight: 10, lineHeight: 1.3 }}>{title}</h2>
                <span style={{ background: '#FFF3E0', color: '#B45309', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, border: '1px solid #FDE0B2' }}>{tag}</span>
              </div>
              <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, marginBottom: 12 }}>{detail}</p>
              <span style={{ fontSize: 11, color: '#888888', fontWeight: 700, background: '#F8F7F4', padding: '4px 10px', borderRadius: 8, border: '1px solid #E5E2DC', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FileText size={11} /> {ref}
              </span>
            </div>
          ))}
        </div>

        {/* Questions teaser */}
        <div style={{ marginTop: 18, borderRadius: 18, padding: '16px', border: '1px solid rgba(44,74,124,0.14)', background: 'linear-gradient(135deg, rgba(44,74,124,0.04) 0%, rgba(79,124,172,0.05) 100%)', boxShadow: '0 2px 8px rgba(44,74,124,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={16} color="#2C4A7C" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C4A7C' }}>Questions to Ask</h3>
          </div>
          <div style={{ background: 'white', padding: '13px 14px', borderRadius: 13, border: '1px solid #E5E2DC', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', lineHeight: 1.5 }}>"Could we reduce the non-compete to 12 months to match the standard for this role?"</p>
          </div>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#2C4A7C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
            See all 4 questions <ChevronRight size={15} />
          </button>
        </div>

      </div>

      {/* Before You Sign CTA */}
      <div style={{ position: 'absolute', bottom: 92, left: 0, right: 0, padding: '0 16px', pointerEvents: 'none', zIndex: 20, display: 'flex', justifyContent: 'center' }}>
        <button style={{ pointerEvents: 'auto', background: 'linear-gradient(135deg, #2C4A7C 0%, #3D6199 100%)', color: 'white', padding: '15px 34px', borderRadius: 30, fontWeight: 700, fontSize: 15, boxShadow: '0 8px 24px rgba(44,74,124,0.32)', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
          Before You Sign <ChevronRight size={17} />
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
