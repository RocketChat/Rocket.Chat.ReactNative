import type { IceServer } from '../../../definitions/Voip';

export const parseStringToIceServer = (server: string): IceServer => {
	const credentials = server.trim().split('@');
	const urls = credentials.pop() as string;
	const [username, credential] = credentials.length === 1 ? credentials[0].split(':') : [];

	return {
		urls,
		...(username &&
			credential && {
				username: decodeURIComponent(username),
				credential: decodeURIComponent(credential)
			})
	};
};

export const parseStringToIceServers = (string: string): IceServer[] => {
	if (!string) {
		return [];
	}
	const lines = string.trim() ? string.split(',') : [];
	return lines.map(line => parseStringToIceServer(line));
};
