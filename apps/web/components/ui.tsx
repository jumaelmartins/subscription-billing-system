'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export const cn = (...a: Array<string | false | null | undefined>) => clsx(a);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
    ghost: 'text-zinc-300 hover:bg-zinc-800',
    danger: 'bg-red-600/90 hover:bg-red-500 text-white',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/50 p-5', className)}>
      {children}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-blue-500',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500',
        className,
      )}
      {...(props as object)}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-400">{error}</span>}
    </label>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  trialing: 'bg-blue-500/15 text-blue-400',
  past_due: 'bg-amber-500/15 text-amber-400',
  paused: 'bg-zinc-500/15 text-zinc-400',
  canceled: 'bg-zinc-500/15 text-zinc-400',
  expired: 'bg-zinc-500/15 text-zinc-400',
  inactive: 'bg-zinc-500/15 text-zinc-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  open: 'bg-blue-500/15 text-blue-400',
  failed: 'bg-red-500/15 text-red-400',
  void: 'bg-zinc-500/15 text-zinc-400',
  refunded: 'bg-purple-500/15 text-purple-400',
  received: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-amber-500/15 text-amber-400',
  processed: 'bg-emerald-500/15 text-emerald-400',
  ignored: 'bg-zinc-500/15 text-zinc-400',
  sent: 'bg-emerald-500/15 text-emerald-400',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_COLORS[value] ?? 'bg-zinc-500/15 text-zinc-400',
      )}
    >
      {value}
    </span>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">{children}</thead>;
}
export function TH({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}
export function TR({ children }: { children: ReactNode }) {
  return <tr className="border-t border-zinc-800 hover:bg-zinc-900/40">{children}</tr>;
}
export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-zinc-300', className)}>{children}</td>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-zinc-500">{children}</div>;
}
