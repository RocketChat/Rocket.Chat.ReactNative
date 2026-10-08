import { create } from 'zustand';

interface IPexipCall {
	callId: string;
	url: string;
	rid?: string;
	startedAt: number;
}

export type TPexipCallLayout = 'full' | 'split' | 'minimized';

interface IPexipCallStore {
	call: IPexipCall | null;
	layout: TPexipCallLayout;
	open: (call: Omit<IPexipCall, 'startedAt'>) => void;
	split: () => void;
	minimize: () => void;
	expand: () => void;
	leave: () => void;
}

export const usePexipCallStore = create<IPexipCallStore>(set => ({
	call: null,
	layout: 'full',
	open: call => set({ call: { ...call, startedAt: Date.now() }, layout: 'full' }),
	split: () => set({ layout: 'split' }),
	minimize: () => set({ layout: 'minimized' }),
	expand: () => set({ layout: 'full' }),
	leave: () => set({ call: null, layout: 'full' })
}));

export const useIsInPexipCall = (callId?: string): boolean =>
	usePexipCallStore(state => !!state.call && (!callId || state.call.callId === callId));

export const useIsPexipCallSplit = (): boolean => usePexipCallStore(state => !!state.call && state.layout === 'split');
