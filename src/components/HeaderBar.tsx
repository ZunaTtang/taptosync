import type { PropsWithChildren, ReactNode } from 'react';

interface HeaderBarProps extends PropsWithChildren {
  actions?: ReactNode;
}

export function HeaderBar({ children, actions }: HeaderBarProps) {
  return (
    <header
      className="header-bar border-b border-gray-200 bg-[color:var(--color-surface)]/95 backdrop-blur"
      role="banner"
    >
      <div className="app-container mx-auto px-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 h-full">
        <div className="space-y-1">{children}</div>
        <div className="shrink-0">{actions}</div>
      </div>
    </header>
  );
}
