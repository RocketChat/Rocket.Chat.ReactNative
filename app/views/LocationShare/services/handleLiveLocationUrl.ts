import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import Navigation from '../../../lib/navigation/appNavigation';
import I18n from '../../../i18n';
import { isLiveLocationActive, reopenLiveLocationModal, getCurrentLiveParams } from '../LiveLocationPreviewModal';

const ENDED_KEY = 'live_location_ended_ids_v1';
let endedIds: Set<string> | null = null;

async function loadEndedSet(): Promise<Set<string>> {
	if (!endedIds) {
		try {
			const raw = await AsyncStorage.getItem(ENDED_KEY);
			endedIds = new Set(raw ? JSON.parse(raw) : []);
		} catch {
			endedIds = new Set();
		}
	}
	return endedIds!;
}
async function saveEndedSet() {
	if (!endedIds) return;
	try {
		await AsyncStorage.setItem(ENDED_KEY, JSON.stringify(Array.from(endedIds)));
	} catch (e) {
		// Failed to persist ended IDs
	}
}

export async function markLiveLocationAsEnded(id: string) {
	const set = await loadEndedSet();
	set.add(id);
	await saveEndedSet();
}

export async function isLiveLocationEnded(id: string) {
	const set = await loadEndedSet();
	return set.has(id);
}

export function isLiveMessageLink(url: string) {
	return /^rocketchat:\/\/live-location/i.test(url);
}

export async function handleLiveLocationUrl(url: string) {
	try {
		if (!isLiveMessageLink(url)) return;

		const u = new URL(url);
		if (u.protocol !== 'rocketchat:' || u.host !== 'live-location') return;

		const liveLocationId = u.searchParams.get('liveLocationId') || undefined;
		const provider = (u.searchParams.get('provider') || 'osm') as 'google' | 'osm';
		const rid = u.searchParams.get('rid') || undefined;
		const tmid = u.searchParams.get('tmid') || undefined;

		if (liveLocationId && (await isLiveLocationEnded(liveLocationId))) {
			Alert.alert(I18n.t('Live_Location_Ended_Title'), I18n.t('Live_Location_Ended_Message'), [{ text: I18n.t('OK') }]);
			return;
		}

		if (!isLiveLocationActive()) {
			// Handle cold start - navigate to live location viewer
			Navigation.navigate('LiveLocationPreviewModal', {
				provider,
				...(rid ? { rid } : {}),
				...(tmid ? { tmid } : {}),
				liveLocationId,
				isTracking: false
			});
			return true;
		}

		const params = getCurrentLiveParams();
		if (params?.liveLocationId && liveLocationId && params.liveLocationId !== liveLocationId) {
			return;
		}

		reopenLiveLocationModal();
	} catch (e) {
		// Invalid URL format
	}
}
