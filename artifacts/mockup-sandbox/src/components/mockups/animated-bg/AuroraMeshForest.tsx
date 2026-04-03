import React from 'react';

export function AuroraMeshForest() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center font-sans" style={{ background: '#f5f7f4' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: '-8%',
            left: '-6%',
            width: '540px',
            height: '540px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.38) 0%, rgba(34,197,94,0) 70%)',
            filter: 'blur(100px)',
            opacity: 0.75,
            animation: 'forest-float-1 24s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '-4%',
            right: '-8%',
            width: '580px',
            height: '580px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.42) 0%, rgba(20,184,166,0) 70%)',
            filter: 'blur(115px)',
            opacity: 0.65,
            animation: 'forest-float-2 30s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-10%',
            left: '22%',
            width: '510px',
            height: '510px',
            background: 'radial-gradient(circle, rgba(101,163,13,0.35) 0%, rgba(101,163,13,0) 70%)',
            filter: 'blur(105px)',
            opacity: 0.7,
            animation: 'forest-float-3 21s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border shadow-sm" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.22)' }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#15803d' }}>
            Structured Document Analysis
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: '#0f1f14', letterSpacing: '-0.02em' }}>
          Stop guessing what a document requires.
        </h1>

        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#365240', fontWeight: 300 }}>
          PlainPath reads your paperwork and gives you a clear, prioritized action plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-md w-full sm:w-auto text-white" style={{ background: '#16a34a' }}>
            Analyze a Document
          </button>
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all w-full sm:w-auto border" style={{ background: 'rgba(255,255,255,0.65)', borderColor: 'rgba(22,163,74,0.25)', color: '#166534', backdropFilter: 'blur(8px)' }}>
            View demos
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium" style={{ color: '#4a7c59' }}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#22c55e' }}></span>
            From $4.99/month
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#22c55e' }}></span>
            No account required
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#22c55e' }}></span>
            Documents not stored by PlainPath
          </div>
        </div>
      </div>

      <style>{`
        @keyframes forest-float-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 80px) scale(1.06); }
          100% { transform: translate(-40px, 35px) scale(0.93); }
        }
        @keyframes forest-float-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-85px, 45px) scale(0.92); }
          100% { transform: translate(50px, -70px) scale(1.08); }
        }
        @keyframes forest-float-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(70px, -75px) scale(1.05); }
          100% { transform: translate(-55px, -20px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}
