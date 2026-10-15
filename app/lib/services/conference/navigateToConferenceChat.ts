import type { SubscriptionType } from '~/definitions';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

type TConferenceChat = { rid: string; name: string; t: SubscriptionType };

export const navigateToConferenceChat = async ({
	chat,
	isMasterDetail
}: {
	chat: TConferenceChat;
	isMasterDetail: boolean;
}): Promise<void> => {
	useConferenceCallStore.getState().minimize();

	const currentRoute = Navigation.getCurrentRoute();
	if (currentRoute?.name !== 'RoomsListView' && currentRoute?.name !== 'RoomView') {
		Navigation.navigate('ChatsStackNavigator');
	}

	await goRoom({ item: chat, isMasterDetail });
};
