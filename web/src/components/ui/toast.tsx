'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toast({ title, variant, onClose }: { title: string; variant: 'default' | 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all animate-slide-up',
      variant === 'success' && 'border-emerald-500/30 bg-emerald-950 text-emerald-200',
      variant === 'error' && 'border-red-500/30 bg-red-950 text-red-200',
      variant === 'default' && 'border-border bg-card text-foreground'
    )}>
      <p className="text-sm font-medium">{title}</p>
      <button onClick={onClose} className="absolute right-2 top-2 rounded-md p-1 text-current opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none group-hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}