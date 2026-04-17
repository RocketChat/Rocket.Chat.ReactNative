import AsyncStorage from '@react-native-async-storage/async-storage';

const processingIds = new Set<string>();

export const isPushVideoConfAlreadyProcessed = async (notificationId?: string | null): Promise<boolean> => {
    if (!notificationId) {
        return false; // Can't dedup without an ID
    }

    // 1. Synchronously check and lock in-memory to prevent TOCTOU race condition
    if (processingIds.has(notificationId)) {
        return true;
    }
    processingIds.add(notificationId);

    // 2. Check persistent storage (for cold boot scenarios)
    try {
        const lastId = await AsyncStorage.getItem('lastProcessedVideoConfNotificationId');
        if (lastId === notificationId) {
            return true;
        }

        // 3. Persist new ID
        await AsyncStorage.setItem('lastProcessedVideoConfNotificationId', notificationId);
    } catch (e) {
        // Ignore storage errors, we still have the in-memory lock
        console.warn('Error reading/writing video conf dedup state', e);
    }

    return false;
};
