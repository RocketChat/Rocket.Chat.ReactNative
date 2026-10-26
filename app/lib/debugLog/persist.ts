import UserPreferences from '../methods/userPreferences';
import { DEBUG_LOGS_KEY } from '../constants/keys';
import { getDebugLogs, restoreDebugLogs, subscribeDebugLogs, type IDebugLogEntry } from './debugLog';

const FLUSH_DELAY_MS = 2000;

let flushTimer: ReturnType<typeof setTimeout> | undefined;

const flush = () => {
	flushTimer = undefined;
	UserPreferences.setString(DEBUG_LOGS_KEY, JSON.stringify(getDebugLogs()));
};

const readPrevious = (): IDebugLogEntry[] => {
	try {
		const previous = JSON.parse(UserPreferences.getString(DEBUG_LOGS_KEY) ?? '[]');
		return Array.isArray(previous) ? previous : [];
	} catch {
		return [];
	}
};

export const installDebugLogPersistence = (): void => {
	restoreDebugLogs(readPrevious());
	subscribeDebugLogs(() => {
		if (!flushTimer) {
			flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
		}
	});
};
