import { create } from 'zustand';

export type TConferencePhase = 'preflight' | 'joining' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'error';

export type TConferenceError = 'not-licensed' | 'not-configured' | 'token-failed' | 'join-failed' | 'unsupported' | 'ended';

type TConferenceCall = {
	callId?: string;
	rid?: string;
	server?: string;
	expanded: boolean;
	phase: TConferencePhase;
	error?: TConferenceError;
	connectedAt?: number;
	open: (call: { callId: string; rid?: string; server?: string }) => void;
	assignCall: (callId: string, rid?: string) => void;
	setPhase: (phase: TConferencePhase, error?: TConferenceError) => void;
	expand: () => void;
	minimize: () => void;
	close: () => void;
};

const PREFLIGHT_PREFIX = 'new:';

export const preflightCallId = (rid: string): string => `${PREFLIGHT_PREFIX}${rid}`;

export const isPreflightCallId = (callId: string): boolean => callId.startsWith(PREFLIGHT_PREFIX);

export const isConferenceSessionActive = (phase: TConferencePhase): boolean =>
	phase === 'joining' || phase === 'connecting' || phase === 'connected' || phase === 'reconnecting';

export const isInConferenceCall = (): boolean => isConferenceSessionActive(useConferenceCallStore.getState().phase);

const isFinished = (phase: TConferencePhase): boolean => phase === 'ended' || phase === 'error';

export const useConferenceCallStore = create<TConferenceCall>(set => ({
	callId: undefined,
	rid: undefined,
	server: undefined,
	expanded: false,
	phase: 'preflight',
	error: undefined,
	connectedAt: undefined,

	open: ({ callId, rid, server }) =>
		set(current => {
			if (current.callId === callId && current.server === server && !isFinished(current.phase)) {
				return { expanded: true };
			}

			return { callId, rid, server, expanded: true, phase: 'preflight', error: undefined, connectedAt: undefined };
		}),

	assignCall: (callId, rid) => set(current => ({ callId, rid: rid ?? current.rid })),

	setPhase: (phase, error) =>
		set(current => ({
			phase,
			error,
			connectedAt: phase === 'connected' ? (current.connectedAt ?? Date.now()) : current.connectedAt
		})),

	expand: () => set(current => (current.callId ? { expanded: true } : current)),

	minimize: () => set({ expanded: false }),

	close: () =>
		set({
			callId: undefined,
			rid: undefined,
			server: undefined,
			expanded: false,
			phase: 'preflight',
			error: undefined,
			connectedAt: undefined
		})
}));
