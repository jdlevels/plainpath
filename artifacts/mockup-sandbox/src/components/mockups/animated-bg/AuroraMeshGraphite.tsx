import React from 'react';

export function AuroraMeshGraphite() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center font-sans" style={{ background: '#f9fafb' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: '-12%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(148,163,184,0.5) 0%, rgba(148,163,184,0) 70%)',
            filter: 'blur(110px)',
            opacity: 0.6,
            animation: 'graphite-float-1 26s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '-6%',
            right: '-12%',
            width: '650px',
            height: '650px',
            background: 'radial-gradient(circle, rgba(203,213,225,0.6) 0%, rgba(203,213,225,0) 70%)',
            filter: 'blur(130px)',
            opacity: 0.55,
            animation: 'graphite-float-2 32s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-12%',
            left: '18%',
            width: '560px',
            height: '560px',
            background: 'radial-gradient(circle, rgba(100,116,139,0.35) 0%, rgba(100,116,139,0) 70%)',
            filter: 'blur(120px)',
            opacity: 0.5,
            animation: 'graphite-float-3 22s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border" style={{ background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.1)' }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569', letterSpacing: '0.15em' }}>
            Structured Document Analysis
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: '#0f172a', letterSpacing: '-0.025em' }}>
          Stop guessing what a document requires.
        </h1>

        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed font-light" style={{ color: '#64748b' }}>
          PlainPath reads your paperwork and gives you a clear, prioritized action plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all w-full sm:w-auto text-white" style={{ background: '#0f172a' }}>
            Analyze a Document
          </button>
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all w-full sm:w-auto border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(15,23,42,0.12)', color: '#334155', backdropFilter: 'blur(8px)' }}>
            View demos
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm" style={{ color: '#94a3b8' }}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#94a3b8' }}></span>
            From $4.99/month
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#94a3b8' }}></span>
            No account required
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#94a3b8' }}></span>
            Documents not stored by PlainPath
          </div>
        </div>
      </div>

      <style>{`
        @keyframes graphite-float-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 85px) scale(1.07); }
          100% { transform: translate(-30px, 40px) scale(0.94); }
        }
        @keyframes graphite-float-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-90px, 50px) scale(0.93); }
          100% { transform: translate(55px, -75px) scale(1.07); }
        }
        @keyframes graphite-float-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(75px, -80px) scale(1.06); }
          100% { transform: translate(-60px, -30px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
