import React, { useEffect, useRef } from "react";
import { ArrowRight, FileText, Play } from "lucide-react";

export function GridPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Wave properties
    let waveRadius = 0;
    const waveSpeed = 80; // px per second
    const gridSpacing = 28;
    const baseRadius = 1.5;
    const baseColor = "rgba(148, 163, 184, 0.15)";
    const peakColor = "rgba(99, 102, 241, 0.8)";
    const waveWidth = 40; // ±20px
    
    let lastTime = performance.now();

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const draw = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) * 1.2;

      waveRadius += waveSpeed * dt;
      if (waveRadius > maxDist) {
        waveRadius = 0;
      }

      for (let x = 0; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const distFromWave = Math.abs(dist - waveRadius);
          
          let radius = baseRadius;
          let color = baseColor;

          if (distFromWave < waveWidth / 2) {
            // Bell curve effect
            const intensity = Math.cos((distFromWave / (waveWidth / 2)) * (Math.PI / 2));
            radius = baseRadius + intensity * 1.5;
            
            // Interpolate colors manually for simplicity or just use alpha
            // baseColor is rgba(148, 163, 184, 0.15) -> peakColor is rgba(99, 102, 241, 0.8)
            const r = Math.round(148 + (99 - 148) * intensity);
            const g = Math.round(163 + (102 - 163) * intensity);
            const b = Math.round(184 + (241 - 184) * intensity);
            const a = 0.15 + (0.8 - 0.15) * intensity;
            color = `rgba(${r}, ${g}, ${b}, ${a})`;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 font-sans text-slate-50 flex items-center justify-center">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 block h-full w-full"
      />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 backdrop-blur-sm">
          <FileText className="mr-2 h-3.5 w-3.5" />
          Structured Document Analysis
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
          Stop guessing what a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
            document requires.
          </span>
        </h1>
        
        <p className="max-w-xl text-lg md:text-xl text-slate-400">
          Every required step, document, and deadline — extracted and organized.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            Analyze a Document
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900">
            <Play className="h-4 w-4 text-slate-400" />
            View demos
          </button>
        </div>
        
        <div className="pt-8">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
            <span>&middot; From $4.99/month</span>
            <span>&middot; No account required</span>
            <span>&middot; Documents not stored</span>
          </p>
        </div>
      </div>
    </div>
  );
}
