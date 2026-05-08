import { create } from 'zustand';

export interface AgentEvent {
  id: string;
  type: string;
  agent: string;
  timestamp: number;
  data: any;
}

interface SolveState {
  events: AgentEvent[];
  agentStatuses: Record<string, string>;
  status: string;
  prUrl: string | null;
  addEvent: (event: AgentEvent) => void;
  reset: () => void;
}

export const useSolveStore = create<SolveState>((set) => ({
  events: [],
  agentStatuses: {},
  status: 'idle',
  prUrl: null,
  addEvent: (event) =>
    set((state) => {
      if (event.type === 'status') {
        return {
          events: [...state.events, event],
          agentStatuses: { ...state.agentStatuses, [event.agent]: event.data.status },
        };
      }
      if (event.type === 'pr_created') {
        return { events: [...state.events, event], prUrl: event.data.url };
      }
      return { events: [...state.events, event] };
    }),
  reset: () => set({ events: [], agentStatuses: {}, status: 'idle', prUrl: null }),
}));