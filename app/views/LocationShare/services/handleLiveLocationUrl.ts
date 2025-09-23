// app/lib/deeplinks/handleLiveLocationUrl.ts
import { URL } from 'react-native-url-polyfill';
import { Alert } from 'react-native';
import { reopenLiveLocationModal, isLiveLocationActive, getCurrentLiveParams } from '../LiveLocationPreviewModal';
import Navigation from '../../../lib/navigation/appNavigation';

// Track ended live location sessions
const endedLiveLocationSessions = new Set<string>();

export function markLiveLocationAsEnded(liveLocationId: string) {
	endedLiveLocationSessions.add(liveLocationId);
}

export function isLiveLocationEnded(liveLocationId: string): boolean {
	return endedLiveLocationSessions.has(liveLocationId);
}

export function clearEndedSessions() {
	endedLiveLocationSessions.clear();
}

export function handleLiveLocationUrl(url: string) {
	try {
		const u = new URL(url);
		if (u.protocol !== 'rocketchat:' || u.hostname !== 'live-location') return false;

		const liveLocationId = u.searchParams.get('liveLocationId') || '';
		const action = u.searchParams.get('action') || 'reopen';
		const provider = u.searchParams.get('provider') || 'google';

		// Check if this live location session has ended
		if (isLiveLocationEnded(liveLocationId)) {
			Alert.alert('Live Location Ended', 'This live location session has ended and is no longer available.', [{ text: 'OK' }]);
			return true; // Handle the URL but don't navigate
		}

		const current = getCurrentLiveParams?.();
		if (action === 'reopen' && isLiveLocationActive() && current?.liveLocationId === liveLocationId) {
			reopenLiveLocationModal();
			return true;
		}

		// Fallback: open viewer for this liveLocationId
		Navigation.navigate('LiveLocationPreviewModal', {
			provider,
			liveLocationId,
			isTracking: false
		});
		return true;
	} catch {
		return false;
	}
}
