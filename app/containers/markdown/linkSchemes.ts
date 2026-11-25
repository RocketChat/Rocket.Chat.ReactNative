export const USER_SCHEME = 'user://';
export const CHANNEL_SCHEME = 'channel://';
export const TIMESTAMP_SCHEME = 'timestamp://';
export const ME_QUERY = '?me=1';
export const TEAM_QUERY = '?team=1';

export type TUserLinkKind = 'user' | 'me' | 'team';

const USER_LINK_QUERY: Record<TUserLinkKind, string> = { user: '', me: ME_QUERY, team: TEAM_QUERY };

export type TInternalLink =
	| { type: 'user'; rid: string; kind: TUserLinkKind }
	| { type: 'channel'; rid: string }
	| { type: 'timestamp'; unixSeconds: number };

export const buildUserLink = (rid: string, kind: TUserLinkKind = 'user'): string =>
	`${USER_SCHEME}${rid}${USER_LINK_QUERY[kind]}`;

export const buildChannelLink = (rid: string): string => `${CHANNEL_SCHEME}${rid}`;

export const buildTimestampLink = (unixSeconds: number): string => `${TIMESTAMP_SCHEME}${unixSeconds}`;

const userLinkKind = (query: string): TUserLinkKind => {
	if (query === ME_QUERY) return 'me';
	if (query === TEAM_QUERY) return 'team';
	return 'user';
};

const startsWithScheme = (url: string, scheme: string): boolean => url.slice(0, scheme.length).toLowerCase() === scheme;

export const parseInternalLink = (url: string): TInternalLink | null => {
	if (startsWithScheme(url, USER_SCHEME)) {
		const [rid, query] = url.slice(USER_SCHEME.length).split('?');
		return { type: 'user', rid, kind: userLinkKind(query ? `?${query}` : '') };
	}
	if (startsWithScheme(url, CHANNEL_SCHEME)) {
		return { type: 'channel', rid: url.slice(CHANNEL_SCHEME.length) };
	}
	if (startsWithScheme(url, TIMESTAMP_SCHEME)) {
		return { type: 'timestamp', unixSeconds: Number(url.slice(TIMESTAMP_SCHEME.length)) };
	}
	return null;
};

export const isInternalLink = (url: string): boolean => parseInternalLink(url) !== null;
