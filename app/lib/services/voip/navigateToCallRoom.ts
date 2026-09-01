import { SubscriptionType } from '../../../definitions';
import { goRoom } from '../../methods/helpers/goRoom';
import Navigation from '../../navigation/appNavigation';
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

	// If we're not in the chats navigator (e.g., in Profile/Settings/Accessibility screens),
	// navigate to ChatsStackNavigator first to ensure goRoom works correctly
	const currentRoute = Navigation.getCurrentRoute() as any;
	if (currentRoute?.name !== 'RoomsListView' && currentRoute?.name !== 'RoomView') {
		Navigation.navigate('ChatsStackNavigator');
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
