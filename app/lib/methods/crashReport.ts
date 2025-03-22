import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANALYTICS_EVENTS_KEY, CRASH_REPORT_KEY } from '../constants';

export async function getAllowCrashReport() {
	const allowCrashReport = await AsyncStorage.getItem(CRASH_REPORT_KEY);
	if (allowCrashReport === null) {
		return true;
	}
	return JSON.parse(allowCrashReport);
}

export async function getAllowAnalyticsEvents() {
	const allowAnalyticsEvents = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
	if (allowAnalyticsEvents === null) {
		return true;
	}
	return JSON.parse(allowAnalyticsEvents);
}
