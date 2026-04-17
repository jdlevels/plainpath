import React from 'react';

export function AppStoreBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="#app-store"
      className={`inline-flex items-center gap-2.5 bg-black text-white rounded-xl px-4 hover:bg-gray-900 transition-colors h-12 sm:h-14 ${className}`}
    >
      <svg viewBox="0 0 814 1000" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-white">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-92.5C46.7 725.6 0 607.2 0 491.7 0 290.9 166.8 190.9 330.9 190.9c85.5 0 156.6 39.5 211.1 39.5 53.8 0 137.9-41.5 209.8-41.5l37.3 1zm-39.3-169.3c30.2-35.8 51.4-85.5 51.4-135.2 0-6.9-.6-13.9-1.9-19.5C753.8 19.4 692.5 52.2 654 87.1c-29.5 27-56 72.4-56 122.5 0 7.6 1.3 14.6 1.9 17.1 3.2.6 8.3 1.3 13.3 1.3 25.5 0 59.8-13.4 85.5-46.4z" />
      </svg>
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium tracking-wider uppercase whitespace-nowrap">Download on the</span>
        <span className="text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap">App Store</span>
      </span>
    </a>
  );
}
