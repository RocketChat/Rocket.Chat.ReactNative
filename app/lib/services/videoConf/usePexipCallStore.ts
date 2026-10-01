import { create } from 'zustand';

interface IPexipCall {
	callId: string;
	url: string;
	rid?: string;
	startedAt: number;
}

interface IPexipCallStore {
	call: IPexipCall | null;
	minimized: boolean;
	open: (call: Omit<IPexipCall, 'startedAt'>) => void;
	minimize: () => void;
	expand: () => void;
	leave: () => void;
}

export const usePexipCallStore = create<IPexipCallStore>(set => ({
	call: null,
	minimized: false,
	open: call => set({ call: { ...call, startedAt: Date.now() }, minimized: false }),
	minimize: () => set({ minimized: true }),
	expand: () => set({ minimized: false }),
	leave: () => set({ call: null, minimized: false })
}));

export const useIsInPexipCall = (callId?: string): boolean =>
	usePexipCallStore(state => !!state.call && (!callId || state.call.callId === callId));
