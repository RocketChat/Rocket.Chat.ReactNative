import AsyncStorage from '@react-native-async-storage/async-storage';
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

		if (liveLocationId && (await isLiveLocationEnded(liveLocationId))) {
			return;
		}

		if (!isLiveLocationActive()) return;

		const params = getCurrentLiveParams();
		if (params?.liveLocationId && liveLocationId && params.liveLocationId !== liveLocationId) {
			return;
		}

		reopenLiveLocationModal();
	} catch (e) {
		// Invalid URL format
	}
}
