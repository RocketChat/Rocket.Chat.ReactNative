import { SubscriptionType } from '../../../definitions';
import { goRoom } from '../../methods/helpers/goRoom';
import { store } from '../../store/auxStore';
import { useCallStore } from './useCallStore';

/**
 * From the VoIP UI, open the DM for the active call: minimizes CallView when it is focused, then navigates.
 * No-ops for SIP calls or when room id or username is missing.
 */
export async function navigateToCallRoom(): Promise<void> {
	const { roomId, contact, focused, toggleFocus } = useCallStore.getState();

	if (!roomId || contact.sipExtension) {
		return;
	}

	const username = contact.username;
	if (!username) {
		return;
	}

	if (focused) {
		toggleFocus();
	}

	const isMasterDetail = store.getState().app.isMasterDetail;

	await goRoom({
		item: {
			rid: roomId,
			name: username,
			t: SubscriptionType.DIRECT
		},
		isMasterDetail
	});
}
