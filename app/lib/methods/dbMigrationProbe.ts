import { Platform } from 'react-native';
import { getInfoAsync, documentDirectory } from 'expo-file-system/legacy';
import DeviceInfo from 'react-native-device-info';

import database from '../database';
import { appGroupPath } from './appGroup';
import { logEvent, events } from './helpers/log';
import userPreferences from './userPreferences';

const PROBE_FIRED_KEY = 'db_migration_probe_v1';

// The WatermelonDB JSI bridge on Android resolves a relative dbName via
// getDatabasePath(dbName + '.db').replace('/databases', ''), so a name like
// 'foo.db' lands at <appDataRoot>/foo.db.db. iOS paths are absolute (from the
// App Group container) and are passed through unchanged.
export function dbFileUri(dbName: string): string {
	if (Platform.OS === 'ios') {
		return `file://${dbName}`;
	}
	const appDataRoot = (documentDirectory ?? '').replace('files/', '');
	return `${appDataRoot}${dbName}.db`;
}

// Mirrors the getDatabasePath + getDatabase transforms in app/lib/database/index.ts.
export function serverUrlToDbName(serverUrl: string): string {
	const path = serverUrl.replace(/(^\w+:|^)\/\//, '').replace(/\//g, '.');
	return `${appGroupPath}${path}.db`;
}

export async function statFileBytes(uri: string): Promise<number | null> {
	try {
		const info = await getInfoAsync(uri);
		return info.exists ? info.size ?? null : null;
	} catch {
		return null;
	}
}

// WAL mode keeps -wal and -shm alongside the main file; include them so the
// reported size reflects actual on-disk footprint. Missing sidecars contribute 0
// (normal when no uncommitted writes are pending). Returns null only when the
// main file itself is absent.
export async function statDbWithSidecars(uri: string): Promise<number | null> {
	const main = await statFileBytes(uri);
	if (main === null) return null;
	const [wal, shm] = await Promise.all([statFileBytes(`${uri}-wal`), statFileBytes(`${uri}-shm`)]);
	return main + (wal ?? 0) + (shm ?? 0);
}

export async function collectDbSizes(): Promise<{ serversDbBytes: number | null; totalBytes: number | null }> {
	const serversDbUri = dbFileUri(`${appGroupPath}default.db`);
	const serversDbBytes = await statDbWithSidecars(serversDbUri);

	try {
		const servers = await database.servers.get('servers').query().fetch();
		const sizes = await Promise.all(servers.map(s => statDbWithSidecars(dbFileUri(serverUrlToDbName(s.id)))));
		const anyMissing = sizes.some(sz => sz === null);
		const serverDbTotal = sizes.reduce<number>((acc, sz) => acc + (sz ?? 0), 0);
		return {
			serversDbBytes,
			totalBytes: anyMissing ? null : (serversDbBytes ?? 0) + serverDbTotal
		};
	} catch {
		return { serversDbBytes, totalBytes: null };
	}
}

export async function runDbMigrationProbe(): Promise<void> {
	try {
		if (userPreferences.getBool(PROBE_FIRED_KEY)) {
			return;
		}

		const [freeDiskBytes, { serversDbBytes, totalBytes }] = await Promise.all([
			DeviceInfo.getFreeDiskStorage(),
			collectDbSizes()
		]);

		logEvent(events.DB_MIGRATION_PROBE, {
			device_model: DeviceInfo.getModel(),
			os_name: DeviceInfo.getSystemName(),
			os_version: DeviceInfo.getSystemVersion(),
			free_disk_mb: Math.round(freeDiskBytes / 1024 / 1024),
			servers_db_bytes: serversDbBytes ?? -1,
			total_db_bytes: totalBytes ?? -1
		});

		userPreferences.setBool(PROBE_FIRED_KEY, true);
	} catch {
		// Probe is best-effort; never crash the app.
	}
}
