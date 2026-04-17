import React from 'react';

interface Props {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function PlayStoreBadge({ className = '', onClick }: Props) {
  const inner = (
    <>
      <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" fill="currentColor">
        <path fill="#EA4335" d="M4.5 21.1c-.2-.2-.4-.6-.4-1.2V4.1c0-.6.1-1 .4-1.2l.1-.1 9.3 9.3v.2l-9.3 9.3-.1-.5z"/>
        <path fill="#FBBC04" d="M18.1 13.7l-4.2-4.2v-.2l4.2-4.2.1.1 5 2.9c1.4.8 1.4 2.1 0 2.9l-5 2.9-.1-.2z"/>
        <path fill="#34A853" d="M13.9 13.8l-9.3 9.3c.4.4 1.1.5 1.9.1l11.6-9.5-4.2-4.1z"/>
        <path fill="#4285F4" d="M13.9 10.2L4.6.9C3.8.5 3.1.6 2.7 1l11.2 11.2-4.2-.9z"/>
      </svg>
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium tracking-wider uppercase whitespace-nowrap">Get it on</span>
        <span className="text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap">Google Play</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2.5 bg-black text-white rounded-xl px-4 hover:bg-gray-900 transition-colors h-12 sm:h-14 cursor-pointer ${className}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      href="#google-play"
      className={`inline-flex items-center gap-2.5 bg-black text-white rounded-xl px-4 hover:bg-gray-900 transition-colors h-12 sm:h-14 ${className}`}
    >
      {inner}
    </a>
  );
}
