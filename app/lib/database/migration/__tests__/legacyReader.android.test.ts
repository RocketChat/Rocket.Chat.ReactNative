/**
 * Android legacy-file addressing regression guard.
 *
 * WMDB on Android landed plaintext files at the app-data ROOT with a DOUBLE `.db.db` suffix
 * (WMDatabase.createSQLiteDatabase appends a second `.db` to RC's already-`.db`-terminated name
 * and strips the `/databases` segment). Addressing them with iOS naming (single `.db`, `/databases`
 * dir) makes the detect phase find nothing and the whole migration silently no-op on Android.
 */

jest.mock('react-native', () => ({
	Platform: { OS: 'android' }
}));

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn()
}));

jest.mock('expo-file-system', () => ({
	Paths: {
		appleSharedContainers: {},
		// app files dir is `<dataRoot>/files`; the literal is inlined (not a top-level const)
		// because the factory runs during the hoisted require, before any const initializes.
		document: { uri: 'file:///data/user/0/chat.rocket.android/files/' }
	}
}));

import { LEGACY_SERVERS_DB_NAME, deriveLegacyServerDbName, resolveLegacyDbDirectory } from '../legacyReader';

describe('legacyReader Android addressing', () => {
	it('names the global DB with a double .db.db suffix', () => {
		expect(LEGACY_SERVERS_DB_NAME).toBe('default.db.db');
	});

	it('derives per-server names with a double .db.db suffix', () => {
		expect(deriveLegacyServerDbName('https://open.rocket.chat')).toBe('open.rocket.chat.db.db');
		expect(deriveLegacyServerDbName('https://open.rocket.chat/')).toBe('open.rocket.chat.db.db');
	});

	it('resolves the legacy directory to the app-data root, not the databases subdir', () => {
		// files dir parent is the data root; WMDB stripped `/databases`, so files live there directly
		expect(resolveLegacyDbDirectory()).toBe('file:///data/user/0/chat.rocket.android');
	});
});
