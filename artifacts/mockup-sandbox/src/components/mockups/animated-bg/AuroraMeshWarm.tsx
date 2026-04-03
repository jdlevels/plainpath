import React from 'react';

export function AuroraMeshWarm() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center font-sans" style={{ background: '#fdf8f3' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: '-5%',
            left: '-8%',
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(251,146,60,0.55) 0%, rgba(251,146,60,0) 70%)',
            filter: 'blur(90px)',
            opacity: 0.7,
            animation: 'warm-float-1 22s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '-8%',
            right: '-5%',
            width: '580px',
            height: '580px',
            background: 'radial-gradient(circle, rgba(244,63,94,0.4) 0%, rgba(244,63,94,0) 70%)',
            filter: 'blur(110px)',
            opacity: 0.55,
            animation: 'warm-float-2 28s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-8%',
            left: '25%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(234,179,8,0.45) 0%, rgba(234,179,8,0) 70%)',
            filter: 'blur(100px)',
            opacity: 0.6,
            animation: 'warm-float-3 19s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border shadow-sm" style={{ background: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.25)' }}>
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
          <button className="px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-sm w-full sm:w-auto border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(194,120,90,0.3)', color: '#7c3b1e', backdropFilter: 'blur(8px)' }}>
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
        @keyframes warm-float-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(55px, 75px) scale(1.08); }
          100% { transform: translate(-35px, 45px) scale(0.92); }
        }
        @keyframes warm-float-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-75px, 55px) scale(0.91); }
          100% { transform: translate(45px, -65px) scale(1.09); }
        }
        @keyframes warm-float-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(65px, -65px) scale(1.07); }
          100% { transform: translate(-45px, -25px) scale(0.94); }
        }
      `}</style>
    </div>
  );
}
