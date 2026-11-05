import { create } from 'zustand';

interface IPexipCall {
	callId: string;
	url: string;
	rid?: string;
	server: string;
	startedAt: number;
}

interface IPexipCallStore {
	call: IPexipCall | null;
	layout: 'full' | 'split';
	open: (call: Omit<IPexipCall, 'startedAt'>) => void;
	split: () => void;
	expand: () => void;
	leave: () => void;
}

export const usePexipCallStore = create<IPexipCallStore>(set => ({
	call: null,
	layout: 'full',
	open: call => set({ call: { ...call, startedAt: Date.now() }, layout: 'full' }),
	split: () => set({ layout: 'split' }),
	expand: () => set({ layout: 'full' }),
	leave: () => set({ call: null, layout: 'full' })
}));

export const isInPexipCall = (): boolean => !!usePexipCallStore.getState().call;

/** True when a Pexip call is already active; brings it back to full screen when it is the requested call. */
export const focusActivePexipCall = (callId: string): boolean => {
	const { call, expand } = usePexipCallStore.getState();
	if (call?.callId === callId) expand();
	return !!call;
};

export const useIsInPexipCall = (): boolean => usePexipCallStore(state => !!state.call);

export const useIsPexipCallFull = (): boolean => usePexipCallStore(state => !!state.call && state.layout === 'full');

export const useIsPexipCallSplit = (rid?: string): boolean =>
	usePexipCallStore(state => !!state.call && state.layout === 'split' && (!rid || state.call.rid === rid));
