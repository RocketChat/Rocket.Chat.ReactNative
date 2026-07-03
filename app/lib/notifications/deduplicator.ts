import UserPreferences from '../methods/userPreferences';

const NOTIFICATION_DEDUPLICATOR_KEY = 'processedNotificationIds';
const MAX_STORED_IDS = 100;

export const isNotificationProcessed = (id?: string | null): boolean => {
	if (!id) {
		return false;
	}
	try {
		const storedJson = UserPreferences.getString(NOTIFICATION_DEDUPLICATOR_KEY);
		if (!storedJson) {
			return false;
		}
		const processedIds = JSON.parse(storedJson);
		if (Array.isArray(processedIds)) {
			return processedIds.includes(id);
		}
		UserPreferences.removeItem(NOTIFICATION_DEDUPLICATOR_KEY);
		return false;
	} catch (e) {
		console.warn('[NotificationDeduplicator] Error reading processed notification IDs:', e);
		UserPreferences.removeItem(NOTIFICATION_DEDUPLICATOR_KEY);
		return false;
	}
};

export const markNotificationAsProcessed = (id?: string | null): void => {
	if (!id) {
		return;
	}
	try {
		const storedJson = UserPreferences.getString(NOTIFICATION_DEDUPLICATOR_KEY);
		let processedIds: string[] = [];
		if (storedJson) {
			const parsed = JSON.parse(storedJson);
			if (Array.isArray(parsed)) {
				processedIds = parsed;
			} else {
				UserPreferences.removeItem(NOTIFICATION_DEDUPLICATOR_KEY);
			}
		}

		// Avoid duplicates in the array
		if (!processedIds.includes(id)) {
			processedIds.push(id);
			// Limit size to MAX_STORED_IDS
			if (processedIds.length > MAX_STORED_IDS) {
				processedIds = processedIds.slice(processedIds.length - MAX_STORED_IDS);
			}
			UserPreferences.setString(NOTIFICATION_DEDUPLICATOR_KEY, JSON.stringify(processedIds));
		}
	} catch (e) {
		console.warn('[NotificationDeduplicator] Error writing processed notification IDs:', e);
		UserPreferences.removeItem(NOTIFICATION_DEDUPLICATOR_KEY);
	}
};
