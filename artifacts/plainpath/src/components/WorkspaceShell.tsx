interface WorkspaceShellProps {
  children: React.ReactNode
  className?: string
}

export function WorkspaceShell({ children, className = "" }: WorkspaceShellProps) {
  return (
    <div
      className={`
        bg-white dark:bg-card
        border border-black/[0.06] dark:border-white/[0.07]
        shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.06)]
        dark:shadow-[0_2px_28px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.03)]
        rounded-[20px] sm:rounded-[24px]
        overflow-hidden
        ${className}
      `.replace(/\s+/g, " ").trim()}
    >
      {children}
    </div>
  )
}
