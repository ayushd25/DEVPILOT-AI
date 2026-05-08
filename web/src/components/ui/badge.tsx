import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'border-transparent bg-emerald-500/10 text-emerald-400',
        variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        variant === 'destructive' && 'border-transparent bg-red-500/10 text-red-400',
        variant === 'outline' && 'border-border text-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Badge };