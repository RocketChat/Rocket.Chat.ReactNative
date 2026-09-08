import { URL } from 'react-native-url-polyfill';

type TConferenceTarget = { callId: string } | { rid: string };

export const buildConferenceUrl = (server: string, target: TConferenceTarget): string => {
	try {
		const base = new URL(`${server.replace(/\/+$/, '')}/`);

		if ('callId' in target) {
			return new URL(`conference/${encodeURIComponent(target.callId)}`, base).toString();
		}

		const url = new URL('conference/new', base);
		url.searchParams.set('rid', target.rid);
		return url.toString();
	} catch {
		return '';
	}
};
