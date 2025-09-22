// app/lib/deeplinks/handleLiveLocationUrl.ts
import { URL } from 'react-native-url-polyfill';
import { reopenLiveLocationModal, isLiveLocationActive, getCurrentLiveParams } from '../LiveLocationPreviewModal';
import Navigation from '../../../lib/navigation/appNavigation';

export function handleLiveLocationUrl(url: string) {
	try {
		const u = new URL(url);
		if (u.protocol !== 'rocketchat:' || u.hostname !== 'live-location') return false;

		const liveLocationId = u.searchParams.get('liveLocationId') || '';
		const action = u.searchParams.get('action') || 'reopen';
		const provider = u.searchParams.get('provider') || 'google';

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
