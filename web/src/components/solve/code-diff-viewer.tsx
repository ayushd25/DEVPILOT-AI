'use client';

import { useSolveStore } from '@/stores/solve.store';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

export function CodeDiffViewer() {
  const events = useSolveStore((s) => s.events);

  // Try to extract real code from coder logs
  const coderLogs = events.filter(e => e.type === 'log' && e.agent === 'coder');
  const hasChanges = coderLogs.some(l => l.data.message?.includes('Generated'));

  // Fallback dummy code if AI hasn't generated anything yet
  const oldCode = `// Waiting for DevPilot AI...\nfunction example() {\n  // Code will appear here once the Coder agent finishes\n  return null;\n}`;
  
  const newCode = hasChanges 
    ? `// ✅ Code Generated Successfully!\n// Changes are being validated by the Tester agent.\n// Check the "Live Agent Logs" panel for details.\nfunction example() {\n  return "DevPilot is working...";\n}`
    : `// Waiting for DevPilot AI...\nfunction example() {\n  // Processing...\n  return null;\n}`;

  return (
    <div className="h-full flex flex-col bg-[#0a0b16]">
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code Changes</span>
      </div>
      <div className="flex-1 overflow-y-auto text-xs">
        <ReactDiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={true}
          compareMethod={DiffMethod.WORDS}
          leftTitle="Before"
          rightTitle="After"
          styles={{
            contentText: { fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' },
            titleBlock: { fontSize: '10px', padding: '4px 8px' },
          }}
          useDarkTheme={true}
        />
      </div>
    </div>
  );
}