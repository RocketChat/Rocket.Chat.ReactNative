export const STATUSES = ['offline', 'online', 'away', 'busy', 'disabled', 'loading'] as const;

export type TUserStatus = (typeof STATUSES)[number];

export const STATUS_I18N_KEYS = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline',
	disabled: undefined,
	loading: undefined
} satisfies Record<TUserStatus, string | undefined>;
