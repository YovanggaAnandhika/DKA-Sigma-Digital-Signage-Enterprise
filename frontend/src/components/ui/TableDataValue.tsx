import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type TableTone = 'primary' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';

export function TableDataValue({
  icon: Icon,
  children,
  detail,
  tone = 'primary',
}: {
  icon: LucideIcon;
  children: ReactNode;
  detail?: ReactNode;
  tone?: TableTone;
}) {
  return (
    <span className={`table-data-value table-tone-${tone}`}>
      <span className="table-data-icon"><Icon size={16} strokeWidth={2} /></span>
      <span className="table-data-copy">
        <div className="table-data-primary">{children}</div>
        {detail != null && <span className="table-data-detail">{detail}</span>}
      </span>
    </span>
  );
}

export function TableStatus({
  icon: Icon,
  children,
  tone = 'primary',
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: TableTone;
}) {
  return (
    <span className={`table-status table-tone-${tone}`}>
      <Icon size={15} strokeWidth={2.2} />
      {children}
    </span>
  );
}
