'use client';

import { ReactFlow, Node, Edge, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSolveStore } from '@/stores/solve.store';
import { Network, Search, Code2, TestTube2, ClipboardCheck } from 'lucide-react';
import { useMemo } from 'react';

const initialNodes: Node[] = [
  { id: 'manager', position: { x: 250, y: 0 }, data: { label: 'Manager' }, type: 'agent', draggable: false },
  { id: 'planner', position: { x: 100, y: 120 }, data: { label: 'Planner', icon: Network }, type: 'agent', draggable: false },
  { id: 'retriever', position: { x: 400, y: 120 }, data: { label: 'Retriever', icon: Search }, type: 'agent', draggable: false },
  { id: 'coder', position: { x: 100, y: 240 }, data: { label: 'Coder', icon: Code2 }, type: 'agent', draggable: false },
  { id: 'tester', position: { x: 400, y: 240 }, data: { label: 'Tester', icon: TestTube2 }, type: 'agent', draggable: false },
  { id: 'reviewer', position: { x: 250, y: 360 }, data: { label: 'Reviewer', icon: ClipboardCheck }, type: 'agent', draggable: false },
];

const initialEdges: Edge[] = [];

export function WorkflowGraph() {
  const agentStatuses = useSolveStore((s) => s.agentStatuses);

  const nodes = useMemo(() => {
    return initialNodes.map((node) => {
      const status = agentStatuses[node.id];
      let borderColor = 'hsl(240 4% 16%)';
      let bgColor = 'hsl(240 10% 6%)';

      if (status === 'working') {
        borderColor = 'hsl(160 84% 39%)';
        bgColor = 'hsl(160 84% 39% / 0.1)';
      } else if (status === 'done') {
        borderColor = 'hsl(160 84% 39%)';
        bgColor = 'hsl(160 84% 39% / 0.05)';
      } else if (status === 'error') {
        borderColor = 'hsl(0 62% 50%)';
        bgColor = 'hsl(0 62% 50% / 0.05)';
      }

      return {
        ...node,
        style: { border: `2px solid ${borderColor}`, background: bgColor, borderRadius: '12px', width: 120, color: 'white' },
      };
    });
  }, [agentStatuses]);

  return (
    <div className="h-[350px] w-full rounded-xl border border-border bg-card overflow-hidden">
      <ReactFlow nodes={nodes} edges={initialEdges} proOptions={{ hideAttribution: true }} nodeTypes={{ agent: () => <div /> }}>
        <Background color="hsl(240 4% 12%)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}