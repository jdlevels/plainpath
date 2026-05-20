import React from 'react';
import { FileText, CheckCircle2, Loader2, Circle, X } from 'lucide-react';
import './_group.css';

export function LoadingExperience() {
  return (
    <div className="plainpath-v15-theme flex flex-col items-center justify-between min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--pp-bg)' }}>
      {/* Top Logo */}
      <div className="flex items-center gap-2 w-full max-w-3xl">
        <div className="w-6 h-6 rounded bg-[#2C4A7C] flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <span className="font-semibold text-[#1A1A1A] tracking-tight">PlainPath</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-12 mt-8 mb-16">
        
        {/* Document Scanner Graphic */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-[#555555] bg-white border border-[#E5E2DC] px-4 py-2 rounded-full shadow-sm">
            <FileText className="w-4 h-4 text-[#4F7CAC]" />
            <span className="font-medium">Residential Lease Agreement.pdf</span>
          </div>

          <div className="relative w-32 h-40 bg-white rounded-lg border-2 border-[#E5E2DC] shadow-sm overflow-hidden flex flex-col p-3 gap-2.5">
            {/* Document lines mock */}
            <div className="w-full h-2 bg-[#F0EDE8] rounded-full"></div>
            <div className="w-3/4 h-2 bg-[#F0EDE8] rounded-full"></div>
            <div className="w-full h-2 bg-[#F0EDE8] rounded-full mt-2"></div>
            <div className="w-full h-2 bg-[#F0EDE8] rounded-full"></div>
            <div className="w-5/6 h-2 bg-[#F0EDE8] rounded-full"></div>
            <div className="w-full h-2 bg-[#F0EDE8] rounded-full"></div>
            
            {/* Scanning line */}
            <div className="absolute left-0 right-0 h-1 bg-[#4F7CAC] opacity-80 shadow-[0_0_8px_2px_rgba(79,124,172,0.5)] animate-scan z-10"></div>
          </div>
        </div>

        {/* Progress List */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Step 1 */}
          <div className="flex items-center gap-4 text-[#888888]">
            <CheckCircle2 className="w-5 h-5 text-[#2D7D4F]" />
            <span className="text-sm font-medium">Reading document</span>
          </div>
          
          {/* Step 2 */}
          <div className="flex items-center gap-4 text-[#888888]">
            <CheckCircle2 className="w-5 h-5 text-[#2D7D4F]" />
            <span className="text-sm font-medium">Extracting key sections</span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4 text-[#2C4A7C] bg-white p-3 -ml-3 rounded-lg border border-[#E5E2DC] shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Finding missing information...</span>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-4 text-[#888888] ml-1">
            <Circle className="w-4 h-4 text-[#E5E2DC] stroke-2" />
            <span className="text-sm font-medium">Building plain-English summary</span>
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-4 text-[#888888] ml-1">
            <Circle className="w-4 h-4 text-[#E5E2DC] stroke-2" />
            <span className="text-sm font-medium">Preparing action plan</span>
          </div>
        </div>

        <div className="text-xs text-[#888888] font-medium text-center animate-pulse-slow">
          Usually takes 15–30 seconds
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-6">
        {/* Global Progress */}
        <div className="w-full max-w-md h-1.5 bg-[#E5E2DC] rounded-full overflow-hidden">
          <div className="h-full bg-[#4F7CAC] animate-progress-slide rounded-full"></div>
        </div>
        
        <button className="text-xs text-[#888888] hover:text-[#555555] transition-colors flex items-center gap-1.5 font-medium">
          <X className="w-3.5 h-3.5" />
          Cancel analysis
        </button>
      </div>
    </div>
  );
}
