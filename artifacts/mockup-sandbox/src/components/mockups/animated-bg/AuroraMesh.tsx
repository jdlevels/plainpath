import React from 'react';

export function AuroraMesh() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-slate-50 flex flex-col items-center justify-center font-sans">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.8) 0%, rgba(79,70,229,0) 70%)',
            animation: 'float-1 20s ease-in-out infinite alternate'
          }}
        />
        <div 
          className="absolute top-[-5%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0) 70%)',
            animation: 'float-2 25s ease-in-out infinite alternate'
          }}
        />
        <div 
          className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[110px] opacity-40 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0) 70%)',
            animation: 'float-3 18s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-indigo-50 border border-indigo-100/50 shadow-sm">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
            Structured Document Analysis
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
          Stop guessing what a document requires.
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
          PlainPath reads your paperwork and gives you a clear, prioritized action plan.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-full sm:w-auto">
            Analyze a Document
          </button>
          <button className="px-8 py-4 bg-white/60 text-slate-700 border border-slate-200/60 rounded-xl font-medium text-lg hover:bg-white/90 transition-all backdrop-blur-md shadow-sm w-full sm:w-auto">
            View demos
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            From $4.99/month
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            No account required
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            Documents not stored by PlainPath
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 80px) scale(1.1); }
          100% { transform: translate(-40px, 40px) scale(0.9); }
        }
        @keyframes float-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, 50px) scale(0.9); }
          100% { transform: translate(40px, -60px) scale(1.1); }
        }
        @keyframes float-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(70px, -70px) scale(1.1); }
          100% { transform: translate(-50px, -30px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}