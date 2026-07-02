export const E2E_MESSAGE_TYPE = 'e2e';
export const E2E_PUBLIC_KEY = 'RC_E2E_PUBLIC_KEY';
export const E2E_PRIVATE_KEY = 'RC_E2E_PRIVATE_KEY';
export const E2E_RANDOM_PASSWORD_KEY = 'RC_E2E_RANDOM_PASSWORD_KEY';
export const E2E_STATUS = {
	PENDING: 'pending',
	DONE: 'done'
} as const;
export const E2E_BANNER_TYPE = {
	REQUEST_PASSWORD: 'REQUEST_PASSWORD',
	SAVE_PASSWORD: 'SAVE_PASSWORD'
};
export const E2E_ROOM_TYPES: Record<string, string> = {
	d: 'd',
	p: 'p'
};

export const THEME_PREFERENCES_KEY = 'RC_THEME_PREFERENCES_KEY';
export const USER_MENTIONS_PREFERENCES_KEY = 'RC_USER_MENTIONS_PREFERENCES_KEY';
export const ROOM_MENTIONS_PREFERENCES_KEY = 'RC_ROOM_MENTIONS_PREFERENCES_KEY';
export const AUTOPLAY_GIFS_PREFERENCES_KEY = 'RC_AUTOPLAY_GIFS_PREFERENCES_KEY';
export const ALERT_DISPLAY_TYPE_PREFERENCES_KEY = 'RC_ALERT_DISPLAY_TYPE_PREFERENCES_KEY';
export const CRASH_REPORT_KEY = 'RC_CRASH_REPORT_KEY';
export const ANALYTICS_EVENTS_KEY = 'RC_ANALYTICS_EVENTS_KEY';
export const TOKEN_KEY = 'reactnativemeteor_usertoken';
/**
 * MMKV key for the auth token, scoped to (server, userId). Scoping by userId alone was ambiguous:
 * two servers can share a userId (a malicious one can force it), so lookups could resolve another
 * server's token (token confusion / exfiltration). Keep in sync with `Ejson.token()` on Android
 * and the migration in the init saga.
 */
export const getUserTokenKey = (server: string, userId: string): string => `${TOKEN_KEY}-${server}-${userId}`;
export const TOKEN_KEY_SERVER_SCOPED_MIGRATED = 'RC_TOKEN_KEY_SERVER_SCOPED_MIGRATED';
export const CURRENT_SERVER = 'currentServer';
export const CERTIFICATE_KEY = 'RC_CERTIFICATE_KEY';
