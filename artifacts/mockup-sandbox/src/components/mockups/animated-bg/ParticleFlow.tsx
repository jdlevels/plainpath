import React, { useMemo } from "react";
import { FileText, CheckCircle2, File } from "lucide-react";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  id: number;
  type: "line" | "icon-doc" | "icon-check" | "icon-file";
  x: number;
  width?: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
}

export function ParticleFlow() {
  const particles = useMemo(() => {
    const random = mulberry32(12345);
    const items: Particle[] = [];

    for (let i = 0; i < 35; i++) {
      items.push({
        id: i,
        type: "line",
        x: random() * 100,
        width: 30 + random() * 90,
        opacity: 0.04 + random() * 0.08,
        duration: 20 + random() * 20,
        delay: -(random() * 20),
        drift: -10 + random() * 20,
      });
    }

    const iconTypes: Array<"icon-doc" | "icon-check" | "icon-file"> = [
      "icon-doc",
      "icon-check",
      "icon-file",
    ];
    for (let i = 0; i < 8; i++) {
      items.push({
        id: 100 + i,
        type: iconTypes[Math.floor(random() * iconTypes.length)],
        x: random() * 100,
        opacity: 0.06 + random() * 0.04,
        duration: 25 + random() * 25,
        delay: -(random() * 25),
        drift: -15 + random() * 30,
      });
    }

    return items;
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden flex flex-col items-center justify-center font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatUp {
          0% { transform: translateY(100vh) translateX(0px); }
          100% { transform: translateY(-20vh) translateX(var(--drift)); }
        }
      ` }} />

      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p) => {
          const style = {
            left: `${p.x}%`,
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
          } as React.CSSProperties;

          if (p.type === "line") {
            return (
              <div
                key={p.id}
                className="absolute bottom-0 h-[2px] bg-slate-300 rounded-full"
                style={{ ...style, width: `${p.width}px` }}
              />
            );
          }

          if (p.type === "icon-doc") {
            return <FileText key={p.id} className="absolute bottom-0 text-slate-300 w-6 h-6" style={style} />;
          }

          if (p.type === "icon-file") {
            return <File key={p.id} className="absolute bottom-0 text-slate-300 w-5 h-5" style={style} />;
          }

          return <CheckCircle2 key={p.id} className="absolute bottom-0 text-slate-300 w-5 h-5" style={style} />;
        })}
      </div>

      <div className="relative z-10 max-w-3xl px-6 text-center flex flex-col items-center">
        <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-slate-800/50 border border-slate-700/50">
          <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Structured Document Analysis
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
          Stop guessing what a <br className="hidden md:block" /> document requires.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any document. Get a clear action plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <button className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Analyze a Document
          </button>
          <button className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-slate-800 text-white border border-slate-700 rounded-lg font-medium transition-colors">
            View demos
          </button>
        </div>

        <div className="text-sm text-slate-500 flex items-center justify-center gap-2 flex-wrap">
          <span>From $4.99/month</span>
          <span className="hidden sm:inline">·</span>
          <span>No account required</span>
          <span className="hidden sm:inline">·</span>
          <span>Documents not stored</span>
        </div>
      </div>
    </div>
  );
}
