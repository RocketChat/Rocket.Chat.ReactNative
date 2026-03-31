import { SubscriptionType } from '../../../definitions';
import { goRoom } from '../../methods/helpers/goRoom';
import Navigation from '../../navigation/appNavigation';
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

	const { username } = contact;
	if (!username) {
		return;
	}

	if (focused) {
		toggleFocus();
	}

	const { app: { isMasterDetail } } = store.getState();

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
