import { cn } from './cn';

type BadgeVariant = 'default' | 'warning' | 'success' | 'critical';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-800 text-slate-100',
  warning: 'bg-yellow-500/20 text-yellow-300',
  success: 'bg-emerald-500/20 text-emerald-300',
  critical: 'bg-rose-500/20 text-rose-300',
};

export function Badge({
  className,
  variant = 'default',
  children,
}: {
  className?: string;
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
