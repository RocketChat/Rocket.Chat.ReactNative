import type { TConferenceError } from '~/lib/services/conference/useConferenceCallStore';

const CONFERENCE_ERRORS: Record<string, TConferenceError> = {
	'error-videoconf-livekit-not-licensed': 'not-licensed',
	'error-videoconf-livekit-not-configured': 'not-configured',
	'error-videoconf-livekit-token-failed': 'token-failed',
	'error-videoconf-invalid-call': 'ended'
};

export const getConferenceError = (error: unknown, fallback: TConferenceError): TConferenceError => {
	const code = (error as { data?: { error?: unknown } } | undefined)?.data?.error;
	return (typeof code === 'string' && CONFERENCE_ERRORS[code]) || fallback;
};
