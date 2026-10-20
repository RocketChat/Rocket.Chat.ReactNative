import { SubscriptionType } from '~/definitions';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { useCallStore } from './useCallStore';

/**
 * From the VoIP UI, open the DM for the active call: minimizes CallView when it is focused, then navigates.
 * No-ops when room id or username is missing (e.g. pure SIP-only peers).
 */
export async function navigateToCallRoom({ isMasterDetail }: { isMasterDetail: boolean }): Promise<void> {
	const { roomId, contact, focused, toggleFocus } = useCallStore.getState();

	if (!roomId) {
		return;
	}

	const { username } = contact;
	if (!username) {
		return;
	}

	if (focused) {
		toggleFocus();
	}

	await goRoom({
		item: {
			rid: roomId,
			name: username,
			t: SubscriptionType.DIRECT
		},
		isMasterDetail
	});
}
