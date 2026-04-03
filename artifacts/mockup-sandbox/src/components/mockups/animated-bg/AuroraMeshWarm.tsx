import React from 'react';

export function AuroraMeshWarm() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center font-sans" style={{ background: '#fdf8f3' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[520px] h-[520px] rounded-full mix-blend-multiply filter blur-[90px] opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(251,146,60,0.85) 0%, rgba(251,146,60,0) 70%)',
            animation: 'warm-1 8s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute top-[-5%] right-[-10%] w-[580px] h-[580px] rounded-full mix-blend-multiply filter blur-[110px] opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(244,63,94,0.75) 0%, rgba(244,63,94,0) 70%)',
            animation: 'warm-2 11s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[20%] w-[510px] h-[510px] rounded-full mix-blend-multiply filter blur-[100px] opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(234,179,8,0.8) 0%, rgba(234,179,8,0) 70%)',
            animation: 'warm-3 9s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full shadow-sm" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#c2410c' }}>
            Structured Document Analysis
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm" style={{ color: '#1c1412' }}>
          Stop guessing what a document requires.
        </h1>

        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed font-light" style={{ color: '#6b4a35' }}>
          PlainPath reads your paperwork and gives you a clear, prioritized action plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-lg w-full sm:w-auto text-white" style={{ background: '#ea580c' }}>
            Analyze a Document
          </button>
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-sm w-full sm:w-auto border" style={{ background: 'rgba(255,255,255,0.65)', borderColor: 'rgba(194,120,90,0.3)', color: '#7c3b1e', backdropFilter: 'blur(8px)' }}>
            View demos
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium" style={{ color: '#a16040' }}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#f97316' }}></span>
            From $4.99/month
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#f97316' }}></span>
            No account required
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full" style={{ background: '#f97316' }}></span>
            Documents not stored by PlainPath
          </div>
        </div>
      </div>

      <style>{`
        @keyframes warm-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(55px, 75px) scale(1.1); }
          100% { transform: translate(-35px, 45px) scale(0.9); }
        }
        @keyframes warm-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-75px, 55px) scale(0.91); }
          100% { transform: translate(45px, -65px) scale(1.09); }
        }
        @keyframes warm-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(65px, -65px) scale(1.07); }
          100% { transform: translate(-45px, -25px) scale(0.94); }
        }
      `}</style>
    </div>
  );
}
