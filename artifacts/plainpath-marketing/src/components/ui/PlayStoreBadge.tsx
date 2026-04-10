import React from 'react';

export function PlayStoreBadge({ className = '' }: { className?: string }) {
  return (
    <a 
      href="#google-play" 
      className={`inline-flex items-center justify-center bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-900 transition-colors h-14 ${className}`}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-500" fill="currentColor">
          <path d="M4.5,21.1c-0.2-0.2-0.4-0.6-0.4-1.2V4.1c0-0.6,0.1-1,0.4-1.2l0.1-0.1l9.3,9.3v0.2l-9.3,9.3L4.5,21.1z"/>
          <path d="M18.1,13.7l-4.2-4.2v-0.2l4.2-4.2l0.1,0.1l5,2.9c1.4,0.8,1.4,2.1,0,2.9l-5,2.9L18.1,13.7z"/>
          <path d="M13.9,13.8l-9.3,9.3c0.4,0.4,1.1,0.5,1.9,0.1L18.2,13.7L13.9,13.8z"/>
          <path d="M13.9,10.2L4.6,0.9C3.8,0.5,3.1,0.6,2.7,1l11.2,11.2L13.9,10.2z"/>
        </svg>
        <div className="flex flex-col items-start leading-none pt-1">
          <span className="text-[10px] text-gray-300 font-sans uppercase tracking-wide">GET IT ON</span>
          <span className="text-xl font-medium font-sans tracking-tight">Google Play</span>
        </div>
      </div>
    </a>
  );
}
